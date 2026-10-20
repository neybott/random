const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'../index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function app({stored=null,cookie=''}={}){
  const values=new Map(stored?[['vp2anwesenheit_settings',stored]]:[]);
  const context=vm.createContext({Date,Intl,TextDecoder,document:{cookie},localStorage:{getItem:key=>values.get(key)||null}});
  // Exercise the shipped functions without booting the UI or adding a test API to the page.
  vm.runInContext(script.slice(0,script.indexOf("$('dropZone').onclick="))+`globalThis.api={defaults,parseCsv,matrixToObjects,matchesFilter,datesForMonth,dateLabel,monthRange,pagesForMonths,sheetRows,canvasLines,validateSettings,loadSettings,fullName,setState(value){state={...defaults(),...value}}};})();`,context);
  return context.api;
}
const plain=value=>JSON.parse(JSON.stringify(value));
test('defaults select every member and weekday in the current month',()=>{
  const s=app().defaults();assert.deepEqual(plain(s.filters),[]);assert.equal(s.weekdays.length,7);assert.equal(s.startMonth,s.endMonth);
});
test('CSV supports BOM, quoted separators, quotes and newlines',()=>{
  const api=app(),matrix=api.parseCsv('\uFEFFVorname;Nachname;Notizen\r\nAnna;"Muster; Name";"Zeile 1\n""Zeile 2"""\r\n');
  const rows=api.matrixToObjects(matrix);assert.equal(rows.length,1);assert.equal(rows[0].Nachname,'Muster; Name');assert.equal(rows[0].Notizen,'Zeile 1\n"Zeile 2"');
});
test('CSV accepts commas, preserves empty cells and requires name headers',()=>{
  const api=app(),rows=api.matrixToObjects(api.parseCsv('Vorname,Nachname,Zweitname\nAnna,Muster,\n'));
  assert.equal(rows[0].Zweitname,'');assert.throws(()=>api.matrixToObjects([['Falscher Header']]),/Vorname und Nachname fehlt/);
});
test('all comparison operators normalize case and whitespace',()=>{
  const api=app(),row={Feld:'  Nachwuchs, Gehörlos  '},match=(operator,value)=>api.matchesFilter(row,{field:'Feld',operator,value});
  assert.equal(match('contains','NACHWUCHS'),true);assert.equal(match('notContains','Trainer'),true);assert.equal(match('equals','Nachwuchs, Gehörlos'),true);assert.equal(match('notEquals','Nachwuchs'),true);assert.equal(match('startsWith','nachwuchs'),true);assert.equal(match('empty',''),false);assert.equal(match('notEmpty',''),true);assert.equal(api.matchesFilter({}, {field:'Feld',operator:'empty',value:''}),true);
});
test('date columns include leap days and the requested German weekday format',()=>{
  const api=app();assert.equal(api.datesForMonth({year:1900,month:1}).length,28);assert.equal(api.datesForMonth({year:2000,month:1}).length,29);assert.equal(api.datesForMonth({year:2028,month:1}).length,29);
  api.setState({weekdays:[2,4]});const dates=api.datesForMonth({year:2026,month:9});assert.equal(dates.length,9);assert.ok(dates.some(date=>api.dateLabel(date)==='DI - 20.10'));
});
test('month ranges cross years and enforce range and weekday limits',()=>{
  const api=app();api.setState({startMonth:'2026-12',endMonth:'2027-02'});assert.deepEqual(plain(api.monthRange()),[{year:2026,month:11},{year:2027,month:0},{year:2027,month:1}]);
  api.setState({startMonth:'2026-01',endMonth:'2027-12'});assert.equal(api.monthRange().length,24);
  api.setState({startMonth:'2026-01',endMonth:'2028-01'});assert.throws(()=>api.monthRange(),/24 Monate/);
  api.setState({startMonth:'2026-02',endMonth:'2026-01'});assert.throws(()=>api.monthRange(),/Endmonat/);
  api.setState({weekdays:[]});assert.throws(()=>api.monthRange(),/Wochentag/);
});
test('settings validation is strict and preserves extra source fields',()=>{
  const api=app(),settings={...api.defaults(),filters:[{field:'Zusatzfeld',operator:'contains',value:'Test'}]},data={format:'vereinsplaner2anwesenheit-settings',version:1,settings};
  assert.equal(api.validateSettings(data).filters[0].field,'Zusatzfeld');assert.throws(()=>api.validateSettings({...data,version:2}));assert.throws(()=>api.validateSettings({...data,settings:{...settings,weekdays:[7]}}));assert.throws(()=>api.validateSettings({...data,settings:{...settings,filters:[{field:'Name',operator:'invalid',value:''}]}}));
});
test('settings load from local storage or cookie and recover from invalid JSON',()=>{
  const settings={...app().defaults(),filters:[{field:'Aktive Rollen',operator:'contains',value:'Nachwuchs'}]},stored=JSON.stringify({format:'vereinsplaner2anwesenheit-settings',version:1,settings});
  assert.equal(app({stored}).loadSettings().filters[0].value,'Nachwuchs');assert.equal(app({cookie:'vp2anwesenheit_settings='+encodeURIComponent(stored)}).loadSettings().filters[0].value,'Nachwuchs');assert.equal(app({stored:'invalid'}).loadSettings().filters.length,0);
});
test('names keep first name before last name with optional middle name',()=>{
  const api=app(),row={Vorname:'Anna',Zweitname:'Maria',Nachname:'Muster'};assert.equal(api.fullName(row),'Anna Muster');api.setState({includeMiddleName:true});assert.equal(api.fullName(row),'Anna Maria Muster');
});

test('page size defaults to 20 and older settings gain the new default',()=>{
  const api=app(),settings=plain(api.defaults());assert.equal(settings.rowsPerPage,20);delete settings.rowsPerPage;
  const data={format:'vereinsplaner2anwesenheit-settings',version:1,settings};assert.equal(api.validateSettings(data).rowsPerPage,20);
  for(const limit of [0,101,2.5,null])assert.throws(()=>api.validateSettings({...data,settings:{...settings,rowsPerPage:limit}}));
});
test('pagination keeps every participant exactly once per month at boundaries',()=>{
  const api=app(),months=[{year:2026,month:9},{year:2026,month:10}];
  for(const count of [0,1,19,20,21,40,41]){
    const rows=Array.from({length:count},(_,id)=>({id})),pages=api.pagesForMonths(months,rows,20),perMonth=Math.ceil(count/20);
    assert.equal(pages.length,perMonth*2);
    for(const month of months){const monthPages=pages.filter(page=>page.month===month);assert.deepEqual(plain(monthPages.flatMap(page=>page.rows)),rows);assert.ok(monthPages.every(page=>page.rows.length<=20));assert.deepEqual(plain(monthPages.map(page=>page.monthPage)),Array.from({length:perMonth},(_,i)=>i+1));}
  }
  assert.throws(()=>api.pagesForMonths(months,[],0));assert.throws(()=>api.pagesForMonths(months,[],2.5));
});

test('every page includes blank writable rows up to the configured size',()=>{
  const api=app(),month={year:2026,month:9};
  for(const limit of [10,20,25]){
    for(const count of [1,limit-1,limit,limit+1,limit*2+5]){
      const rows=Array.from({length:count},(_,id)=>({id})),pages=api.pagesForMonths([month],rows,limit),padded=pages.map(page=>api.sheetRows(page.rows,limit));
      assert.ok(padded.every(page=>page.length===limit));assert.deepEqual(plain(padded.flat().filter(Boolean)),rows);
      assert.equal(padded.flat().filter(row=>row===null).length,pages.length*limit-count);
    }
  }
});

test('PDF text wrapping preserves names and splits long words within cell width',()=>{
  const api=app(),context={measureText:text=>({width:Array.from(text).length})};
  assert.deepEqual(plain(api.canvasLines(context,'Anna Maria Muster',10)),['Anna Maria','Muster']);
  assert.deepEqual(plain(api.canvasLines(context,'Brandstätter',5)),['Brand','stätt','er']);
  assert.deepEqual(plain(api.canvasLines(context,'',10)),['']);
});
