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
  vm.runInContext(script.slice(0,script.indexOf('// Bind controls.'))+`globalThis.api={defaults,parseCsv,matrixToObjects,matchesFilter,datesForMonth,dateLabel,monthRange,pagesForMonths,sheetRows,canvasLines,pageGeometry,groupMembers,columnsForMonth,listPages,validateSettings,loadSettings,fullName,setState(value){state={...defaults(),...value}}};})();`,context);
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

test('legacy settings retain defaults for grouping, orientation and custom columns',()=>{
  const api=app(),settings=plain(api.defaults());for(const key of ['orientation','groupBy','groupLayout','groupOrder','customColumns'])delete settings[key];
  const s=api.validateSettings({format:'vereinsplaner2anwesenheit-settings',version:1,settings});
  assert.equal(s.orientation,'landscape');assert.equal(s.groupBy,'');assert.equal(s.groupLayout,'sections');assert.deepEqual(plain(s.customColumns),[]);
});
test('new layout settings validate and preserve editable column settings',()=>{
  const api=app(),settings=plain(api.defaults()),data=patch=>({format:'vereinsplaner2anwesenheit-settings',version:1,settings:{...settings,...patch}});
  const valid={orientation:'portrait',groupBy:'Aktive Rollen',groupLayout:'pages',groupOrder:['Trainer','Beginner'],customColumns:[{label:'Bezahlt',position:'before'},{label:'',position:'after'}]};
  assert.deepEqual(plain(api.validateSettings(data(valid))).customColumns,valid.customColumns);
  for(const patch of [{orientation:'horizontal'},{groupBy:5},{groupLayout:'invalid'},{groupOrder:'Trainer'},{groupOrder:[5]},{customColumns:[{label:'Test',position:'middle'}]},{customColumns:[{label:'x'.repeat(41),position:'after'}]},{customColumns:Array.from({length:13},()=>({label:'X',position:'after'}))}])assert.throws(()=>api.validateSettings(data(patch)));
});
test('A4 portrait and landscape have corresponding printable dimensions',()=>{
  const api=app();assert.deepEqual(plain(api.pageGeometry('portrait')),{orientation:'portrait',paperWidth:210,paperHeight:297,contentWidth:190,contentHeight:287,nameFraction:.32});
  assert.equal(api.pageGeometry('landscape').contentWidth,277);assert.equal(api.pageGeometry('landscape').contentHeight,200);
});
test('role grouping honors priority, handles multiple roles once and puts missing values last',()=>{
  const api=app(),rows=[{id:1,'Aktive Rollen':'Advanced, Trainer'},{id:2,'Aktive Rollen':'Beginner'},{id:3,'Aktive Rollen':'Intermediate'},{id:4,'Aktive Rollen':''},{id:5,'Aktive Rollen':'trainer; Beginner'},{id:6,'Aktive Rollen':'Sonstige'}];
  const groups=api.groupMembers(rows,'Aktive Rollen',['Trainer','Beginner','Intermediate','Advanced']);
  assert.deepEqual(plain(groups.map(group=>group.label)),['Trainer','Beginner','Intermediate','Sonstige','Ohne Zuordnung']);
  assert.deepEqual(plain(groups[0].rows.map(row=>row.id)),[1,5]);assert.equal(groups.flatMap(group=>group.rows).length,6);
  assert.deepEqual(plain(api.groupMembers(rows,'',[])[0].rows),rows);
});
test('custom source fields use their complete values for grouping',()=>{
  const api=app(),groups=api.groupMembers([{Ort:'Linz, Zentrum'},{Ort:'Linz'}],'Ort',[]);assert.equal(groups.length,2);assert.ok(groups.some(group=>group.label==='Linz, Zentrum'));
});
test('additional columns surround the requested weekdays in stable order',()=>{
  const api=app(),settings={...plain(api.defaults()),weekdays:[2],customColumns:[{label:'Bezahlt',position:'before'},{label:'Notiz',position:'after'},{label:'Test',position:'before'},{label:' ',position:'after'}]},cols=api.columnsForMonth({year:2026,month:9},settings);
  assert.deepEqual(plain(cols.slice(0,2).map(column=>column.label)),['Bezahlt','Test']);assert.equal(cols.at(-1).label,'Notiz');assert.equal(cols.filter(column=>column.kind==='date').length,4);assert.ok(cols.some(column=>column.label==='DI - 20.10'));
});
test('section grouping paginates without orphan headings, lost people or shrunken rows',()=>{
  const api=app(),settings={...plain(api.defaults()),rowsPerPage:24,groupBy:'Aktive Rollen',groupOrder:['Trainer','Beginner','Intermediate','Advanced']},rows=Array.from({length:55},(_,id)=>({id,'Aktive Rollen':settings.groupOrder[Math.floor(id/14)]})),months=[{year:2026,month:9},{year:2026,month:10}],pages=api.listPages(months,rows,settings);
  for(const month of months){const selected=pages.filter(page=>page.month===month);assert.deepEqual(plain(selected.flatMap(page=>page.rows)),rows);assert.ok(selected.length>2);for(const page of selected){assert.equal(page.layout.rowHeight,26);assert.ok(page.rows.length<=24);assert.equal(page.entries[0].type,'group');assert.ok(page.used<=page.layout.bodyBudget);page.entries.forEach((entry,index)=>{if(entry.type==='group')assert.ok(page.entries[index+1]?.row)});}}
  assert.ok(pages.some(page=>page.entries.some(entry=>entry.continued)));
});
test('separate group pages keep all configured participant slots and spare rows',()=>{
  const api=app(),settings={...plain(api.defaults()),rowsPerPage:24,groupBy:'Aktive Rollen',groupLayout:'pages',groupOrder:['Trainer','Beginner']},rows=Array.from({length:25},(_,id)=>({id,'Aktive Rollen':id<24?'Trainer':'Beginner'})),pages=api.listPages([{year:2026,month:9}],rows,settings);
  assert.deepEqual(plain(pages.map(page=>page.groupLabel)),['Trainer','Beginner']);assert.ok(pages.every(page=>page.entries.length===24));assert.equal(pages[1].entries.filter(entry=>entry.row===null).length,23);assert.deepEqual(plain(pages.flatMap(page=>page.rows)),rows);
});
test('ungrouped layout preserves the exact number of name slots in both orientations',()=>{
  const api=app();for(const orientation of ['landscape','portrait']){const settings={...plain(api.defaults()),rowsPerPage:24,orientation},rows=Array.from({length:25},(_,id)=>({id})),pages=api.listPages([{year:2026,month:9}],rows,settings);assert.deepEqual(plain(pages.map(page=>page.entries.length)),[24,24]);assert.deepEqual(plain(pages.flatMap(page=>page.rows)),rows);assert.ok(pages.every(page=>page.layout.rowHeight===26));}
});
