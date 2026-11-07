'use strict';
const KEY='fixmycar_v1';
let db;try{db=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!db||!Array.isArray(db.vehicles)||!Array.isArray(db.cases))db={vehicles:[],cases:[],active:null};
const $=id=>document.getElementById(id),save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const workflows={
crank:[['Confirm crank','Does the engine rotate at a normal speed? Note slow or uneven cranking.','Keep clear of belts and fans.'],['Battery and connections','Inspect terminals and ground connections. Record battery voltage with engine off and while cranking, if you can test safely.','Use correct meter settings. Do not short battery terminals.'],['Check for codes','Record any diagnostic trouble codes using an actual scan tool if available.','A code is a clue, not proof of a failed part.'],['Spark assessment','Determine whether ignition spark has been confirmed using an appropriate insulated spark tester and vehicle-specific procedure.','Do not hold ignition wires or test spark by hand. High voltage can injure.'],['Fuel delivery','Check whether fuel delivery has been verified using the manufacturer-approved procedure.','Fuel is flammable. Do not open pressurized lines or bypass relays without training.'],['Next decision','Review failed or unknown checks and obtain vehicle-specific service information before replacing parts.','If unsure, seek a qualified technician.']],
noc:[['Battery','Check battery condition and terminal tightness.','Avoid shorting terminals.'],['Starting controls','Check whether the dash illuminates and whether the correct Park/Neutral or clutch position is selected.','Secure vehicle against rolling.'],['Starter circuit','Record any clicking and check relevant fuses per service information.','Do not bridge starter terminals.']],
stall:[['When does it stall?','Record whether it stalls at idle, on acceleration or when warm.','Test only while safely parked.'],['Warning lights and codes','Record warning lights and scan codes if available.','Do not drive an unsafe vehicle.'],['Air and fuel checks','Record recent work, intake connections and maintenance history.','Keep hands away from moving engine parts.']],
overheat:[['Stop safely','Switch off engine if temperature is dangerously high; let it cool.','Never open a hot radiator or coolant cap.'],['Visible leaks','When cold, look for coolant loss and damaged hoses.','Coolant is toxic; avoid contact.'],['Cooling operation','Document fan operation and any fault codes using safe procedures.','Fans may start unexpectedly even with engine off.']],
misfire:[['Describe conditions','Record when roughness occurs: idle, acceleration, cold or hot.','Avoid running an engine with severe misfire.'],['Code scan','Record P0300-series and other codes from a real scanner.','A cylinder code does not automatically mean a bad coil.'],['Visual checks','Check for loose connectors or intake hoses with engine off.','Keep away from hot and rotating components.']]};
const codes=[['P0300','Random/multiple cylinder misfire detected','Ignition, fuel, air leaks, mechanical causes'],['P0301','Cylinder 1 misfire detected','Ignition, fuel, compression or wiring'],['P0302','Cylinder 2 misfire detected','Ignition, fuel, compression or wiring'],['P0171','System too lean (Bank 1)','Unmetered air, fuel delivery, sensor issues'],['P0420','Catalyst system efficiency below threshold (Bank 1)','Exhaust leaks, catalyst, oxygen sensor issues'],['P0128','Coolant thermostat below regulating temperature','Thermostat, cooling or sensor issue'],['P0442','Evaporative emission system small leak detected','Cap seal, hoses or EVAP components'],['P0101','Mass or volume air flow circuit range/performance','Airflow sensor, intake or wiring'],['P0335','Crankshaft position sensor A circuit','Sensor circuit, wiring or signal'],['P0562','System voltage low','Battery, charging or connections']];

codes.push(
  ['P0303','Cylinder 3 misfire detected','Spark plug, ignition coil, injector or compression'],
  ['P0304','Cylinder 4 misfire detected','Spark plug, ignition coil, injector or compression'],
  ['P0305','Cylinder 5 misfire detected','Spark plug, ignition coil, injector or compression'],
  ['P0306','Cylinder 6 misfire detected','Spark plug, ignition coil, injector or compression'],
  ['P0174','System too lean (Bank 2)','Vacuum leaks, fuel delivery or airflow sensor'],
  ['P0172','System too rich (Bank 1)','Fuel injectors, fuel pressure or airflow sensor'],
  ['P0175','System too rich (Bank 2)','Fuel injectors, fuel pressure or airflow sensor'],
  ['P0130','Oxygen sensor circuit malfunction (Bank 1 Sensor 1)','Oxygen sensor, wiring or exhaust leaks'],
  ['P0135','Oxygen sensor heater circuit malfunction (Bank 1 Sensor 1)','Heater circuit, fuse, wiring or oxygen sensor'],
  ['P0340','Camshaft position sensor A circuit (Bank 1 or single sensor)','Sensor, wiring or timing-related issues']
);

codes.push(
  ['P0100','Mass or volume airflow circuit malfunction','MAF sensor, intake leaks or wiring'],
  ['P0101','Mass or volume airflow circuit range/performance','MAF sensor, intake restrictions or air leaks'],
  ['P0102','Mass or volume airflow circuit low input','MAF sensor, wiring or connector'],
  ['P0103','Mass or volume airflow circuit high input','MAF sensor, wiring or connector'],
  ['P0110','Intake air temperature sensor circuit malfunction','IAT sensor, connector or wiring'],
  ['P0113','Intake air temperature sensor circuit high input','IAT sensor, open circuit or wiring'],
  ['P0120','Throttle position sensor circuit malfunction','Throttle sensor, connector or wiring'],
  ['P0121','Throttle position sensor range/performance','Throttle sensor, throttle body or wiring'],
  ['P0130','Oxygen sensor circuit malfunction (Bank 1 Sensor 1)','Oxygen sensor, wiring or exhaust leaks'],
  ['P0133','Oxygen sensor slow response (Bank 1 Sensor 1)','Oxygen sensor, exhaust leaks or fuel control'],
  ['P0141','Oxygen sensor heater circuit malfunction (Bank 1 Sensor 2)','Sensor heater, fuse or wiring'],
  ['P0170','Fuel trim malfunction (Bank 1)','Fuel delivery, intake leaks or sensor readi9ngs'],
  ['P0200','Fuel injector circuit malfunction','Injector wiring, connectors or control circuit'],
  ['P0303','Cylinder 3 misfire detected','Spark plug, ignition coil, injector or compression'],
  ['P0304','Cylinder 4 misfire detected','Spark plug, ignition coil, injector or compression'],
  ['P0325','Knock sensor circuit malfunction (Bank 1)','Knock sensor, wiring or connector'],
  ['P0401','Exhaust gas recirculation flow insufficient','EGR passages, valve or control system'],
  ['P0440','Evaporative emission control system malfunction','EVAP hoses, fuel cap or valves'],
  ['P0455','EVAP system large leak detected','Fuel cap, EVAP hoses or purge/vent valves'],
  ['P0500','Vehicle speed sensor malfunction','Speed sensor, wiring or signal circuit']
);

let session=null;
function go(page) {document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===page));document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('selected',x.dataset.go===page));window.scrollTo(0,0);render()}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
function render(){const active=db.vehicles.find(v=>v.id===db.active);$('activeVehicle').textContent=active?`${active.year} ${active.make} ${active.model}${active.engine?' · '+active.engine:''}`:'No vehicle selected. Add one in Garage.';$('vehicleCount').textContent=db.vehicles.length;$('caseCount').textContent=db.cases.length;renderVehicles();renderCases()}
$('vehicleForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),v={id:crypto.randomUUID(),year:String(f.get('year')),make:String(f.get('make')).trim(),model:String(f.get('model')).trim(),engine:String(f.get('engine')).trim()};if(!v.make||!v.model)return;db.vehicles.push(v);db.active=v.id;save();e.target.reset();render()});
function renderVehicles(){$('vehicles').innerHTML=db.vehicles.length?db.vehicles.map(v=>`<div class="record"><b>${clean(v.year)} ${clean(v.make)} ${clean(v.model)}</b><small>${clean(v.engine||'Engine not specified')} ${db.active===v.id?'· ACTIVE':''}</small><button class="secondary" data-activate="${v.id}">Select</button><button class="ghost" data-remove="${v.id}">Delete</button></div>`).join(''):'<p>No saved vehicles.</p>'}
$('vehicles').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.activate){db.active=b.dataset.activate}else if(b.dataset.remove&&confirm('Delete this vehicle? Existing cases will remain.')){db.vehicles=db.vehicles.filter(v=>v.id!==b.dataset.remove);if(db.active===b.dataset.remove)db.active=db.vehicles[0]?.id||null}save();render()});
$('begin').onclick=()=>{session={id:crypto.randomUUID(),vehicleId:db.active,symptom:$('symptom').selectedOptions[0].text,kind:$('symptom').value,index:0,results:[],date:new Date().toISOString()};$('workflow').classList.remove('hidden');showStep()};
function storeStep(){if(!session)return;session.results[session.index]={title:workflows[session.kind][session.index][0],result:$('stepResult').value,notes:$('stepNotes').value.trim()}}
function showStep(){const steps=workflows[session.kind],s=steps[session.index],saved=session.results[session.index]||{};$('stepProgress').textContent=`STEP ${session.index+1} OF ${steps.length}`;$('stepTitle').textContent=s[0];$('stepText').textContent=s[1];$('stepSafety').textContent='⚠️ '+s[2];$('stepResult').value=saved.result||'Not tested';$('stepNotes').value=saved.notes||'';$('previous').disabled=session.index===0;$('next').textContent=session.index===steps.length-1?'Finish & save ✓':'Save & next →'}
$('previous').onclick=()=>{storeStep();if(session.index>0)session.index--;showStep()};$('next').onclick=()=>{storeStep();if(session.index<workflows[session.kind].length-1){session.index++;showStep()}else saveSession()};$('saveCase').onclick=()=>{storeStep();saveSession()};
function saveSession(){const i=db.cases.findIndex(c=>c.id===session.id);if(i>=0)db.cases[i]=session;else db.cases.unshift(session);save();alert('Diagnostic case saved on this device.');$('workflow').classList.add('hidden');session=null;go('history')}
function renderCases(){$('cases').innerHTML=db.cases.length?db.cases.map(c=>{const v=db.vehicles.find(v=>v.id===c.vehicleId);return `<div class="record"><b>${clean(c.symptom)}</b><small>${clean(new Date(c.date).toLocaleString())} · ${v?clean(v.year+' '+v.make+' '+v.model):'Vehicle not selected'} · ${c.results.filter(Boolean).length} recorded steps</small><button class="secondary" data-view="${c.id}">View results</button><button class="ghost" data-delete="${c.id}">Delete</button><div id="details-${c.id}"></div></div>`}).join(''):'<p>No cases saved yet. Start a diagnosis to create one.</p>'}
$('cases').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.delete&&confirm('Delete this diagnostic case?')){db.cases=db.cases.filter(c=>c.id!==b.dataset.delete);save();render()}if(b.dataset.view){const c=db.cases.find(c=>c.id===b.dataset.view),el=$('details-'+c.id);el.innerHTML=el.innerHTML?'':c.results.filter(Boolean).map(r=>`<div class="panel"><b>${clean(r.title)} — ${clean(r.result)}</b><p>${clean(r.notes||'No notes')}</p></div>`).join('')}});
function getProGuide(code) {
  return showProDiagnostics(code);
}
function renderCodes(){const q=$('codeSearch').value.trim().toLowerCase();$('codeResults').innerHTML=codes.filter(c=>c.join(' ').toLowerCase().includes(q)).map(c=>`<div class="record"><b style="color:var(--gold)">${clean(c[0])}</b><p>${clean(c[1])}</p><small>Possible areas to check: ${clean(c[2])}. Confirm with vehicle-specific service data.</small>${getProGuide(c[0])}</div>`).join('')||'<p>No matching code in this starter library.</p>'}
$('codeSearch').addEventListener('input',renderCodes);
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({format:'fixmycar-v1',data:db},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fixmycar-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('import').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(parsed.format!=='fixmycar-v1'||!Array.isArray(parsed.data?.vehicles)||!Array.isArray(parsed.data?.cases))throw Error('Not a FixMyCar backup');if(!confirm('Replace all current vehicle and case records with this backup?'))return;db=parsed.data;save();render();alert('Backup imported.')}catch(err){alert('Import failed: '+err.message)}e.target.value=''});
render();if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});

const PRO_FEATURES = {
  advancedDiagnostics: true,
  detailedRepairGuides: true,
  diagnosticHistory: true,
  priorityTroubleshooting: true
};

const PRO_DIAGNOSTICS = {
  P0300: {
    issue: "Random or multiple cylinder misfire",
    checks: [
      "Read all stored trouble codes.",
      "Inspect spark plugs and ignition coils.",
      "Check for intake air leaks.",
      "Verify fuel delivery.",
      "Check engine compression if needed."
    ]
  },
  P0301: {
    issue: "Cylinder 1 misfire",
    checks: [
      "Inspect cylinder 1 spark plug.",
      "Test cylinder 1 ignition coil.",
      "Check injector operation.",
      "Inspect wiring and connectors.",
      "Verify compression if necessary."
    ]
  }
};

const PRO_P0302 = {
  issue: "Cylinder 2 misfire",
  checks: [
    "Inspect cylinder 2 spark plug.",
    "Test cylinder 2 ignition coil with an approved tester.",
    "Check cylinder 2 fuel injector operation.",
    "Inspect wiring and connectors.",
    "Verify engine compression if necessary."
  ]
};

PRO_DIAGNOSTICS.P0302 = PRO_P0302;

function showProDiagnostics(code) {
  const guide = PRO_DIAGNOSTICS[code.toUpperCase()];
  if (!guide) {
    return "No advanced diagnostic guide available.";
  }

  return `
    <div class="panel">
      <h3>Advanced Diagnostics: ${clean(code)}</h3>
      <p>${clean(guide.issue)}</p>
      <ol>
        ${guide.checks.map(check =>
          `<li>${clean(check)}</li>`
        ).join('')}
      </ol>
    </div>
  `;
}

renderCodes();
