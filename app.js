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
codes.push(
  ['P0335','Crankshaft position sensor A circuit malfunction','Check crankshaft sensor, wiring and connectors.'],
  ['P0341','Camshaft position sensor A circuit range/performance','Check camshaft sensor, timing and wiring.'],
  ['P0420','Catalyst system efficiency below threshold (Bank 1)','Check exhaust leaks, oxygen sensors and catalytic converter.'],
  ['P0430','Catalyst system efficiency below threshold (Bank 2)','Check exhaust leaks, oxygen sensors and catalytic converter.'],
  ['P0442','EVAP system small leak detected','Check fuel cap, EVAP hoses and seals.'],
  ['P0456','EVAP system very small leak detected','Check fuel cap, EVAP hoses and seals.'],
  ['P0505','Idle control system malfunction','Check idle control system, throttle body and air leaks.'],
  ['P0562','System voltage low','Check battery, charging system and connections.'],
  ['P0700','Transmission control system malfunction','Read transmission control module codes.'],
  ['P0715','Input/turbine speed sensor A circuit malfunction','Check transmission speed sensor, wiring and connectors.']
);
codes.push(
  ['P0010','Camshaft position actuator A circuit (Bank 1)','Check VVT solenoid, wiring and oil condition.'],
  ['P0011','Camshaft timing over-advanced (Bank 1)','Check engine oil, VVT solenoid and timing system.'],
  ['P0012','Camshaft timing over-retarded (Bank 1)','Check oil pressure, VVT system and timing components.'],
  ['P0013','Camshaft position actuator B circuit (Bank 1)','Check exhaust VVT solenoid and wiring.'],
  ['P0014','Camshaft timing over-advanced (Bank 1, exhaust)','Check oil condition, VVT actuator and timing.'],
  ['P0016','Crankshaft/camshaft position correlation (Bank 1 Sensor A)','Check timing components, sensors and wiring.'],
  ['P0017','Crankshaft/camshaft position correlation (Bank 1 Sensor B)','Check timing components, sensors and wiring.'],
  ['P0020','Camshaft position actuator A circuit (Bank 2)','Check VVT solenoid, wiring and oil condition.'],
  ['P0021','Camshaft timing over-advanced (Bank 2)','Check oil condition, VVT system and timing.'],
  ['P0022','Camshaft timing over-retarded (Bank 2)','Check oil pressure, VVT solenoid and timing.'],
  ['P0068','MAP/MAF and throttle position correlation','Check intake leaks, throttle body and airflow sensors.'],
  ['P0087','Fuel rail/system pressure too low','Check fuel supply, pressure sensor and pump operation.'],
  ['P0088','Fuel rail/system pressure too high','Check fuel pressure control and sensor readings.'],
  ['P0090','Fuel pressure regulator 1 control circuit','Check regulator control circuit and wiring.'],
  ['P0104','Mass or volume airflow circuit intermittent','Check MAF connector, wiring and intake system.'],
  ['P0115','Engine coolant temperature sensor circuit','Check coolant temperature sensor and wiring.'],
  ['P0116','Engine coolant temperature sensor range/performance','Check coolant temperature readings and thermostat.'],
  ['P0117','Engine coolant temperature sensor circuit low','Check sensor circuit for shorts and connector damage.'],
  ['P0118','Engine coolant temperature sensor circuit high','Check sensor circuit for open connections and wiring.'],
  ['P0128','Coolant thermostat temperature below regulating temperature','Check thermostat, coolant level and temperature sensor.']
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
PRO_DIAGNOSTICS.P0335 = {
  issue: "Crankshaft position sensor A circuit malfunction",
  checks: [
    "Read all stored and pending trouble codes.",
    "Inspect the crankshaft position sensor connector for damage, corrosion or loose pins.",
    "Inspect sensor wiring for cuts, rubbing or heat damage.",
    "Check sensor power, ground and signal using the vehicle-specific wiring diagram.",
    "Check the engine RPM reading while cranking with a compatible scan tool.",
    "Test the sensor and related circuit according to manufacturer specifications.",
    "Inspect the crankshaft reluctor wheel if the sensor and wiring test correctly."
  ]
};

PRO_DIAGNOSTICS.P0340 = {
  issue: "Camshaft position sensor circuit malfunction",
  checks: [
    "Read all stored and pending trouble codes.",
    "Inspect the camshaft position sensor connector for damage or corrosion.",
    "Inspect sensor wiring for loose connections, cuts or heat damage.",
    "Check sensor power, ground and signal using the vehicle-specific wiring diagram.",
    "Check camshaft and crankshaft synchronization with a compatible scan tool.",
    "Test the sensor and circuit according to manufacturer specifications.",
    "Inspect engine timing components if sensor and wiring tests pass."
  ]
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

Object.assign(PRO_DIAGNOSTICS, {
  P0010: {
    issue: "Camshaft position actuator A control circuit (Bank 1)",
    checks: [
      "Read stored and pending codes and freeze-frame data.",
      "Check engine oil level, condition and correct viscosity.",
      "Inspect the Bank 1 intake VVT solenoid connector and wiring.",
      "Test the actuator control circuit using the vehicle wiring diagram.",
      "Test solenoid operation according to manufacturer specifications."
    ]
  },
  P0011: {
    issue: "Camshaft timing over-advanced (Bank 1)",
    checks: [
      "Check engine oil level, condition and viscosity.",
      "Inspect the VVT solenoid and oil passages.",
      "Compare commanded and actual camshaft timing with a scan tool.",
      "Check oil pressure against manufacturer specifications.",
      "Inspect mechanical timing if the VVT system tests correctly."
    ]
  },
  P0012: {
    issue: "Camshaft timing over-retarded (Bank 1)",
    checks: [
      "Check oil level, condition and correct viscosity.",
      "Inspect the intake VVT solenoid and connector.",
      "Check for restricted oil passages.",
      "Compare commanded and actual camshaft timing.",
      "Verify mechanical timing if other tests pass."
    ]
  },
  P0013: {
    issue: "Camshaft position actuator B control circuit (Bank 1)",
    checks: [
      "Inspect the Bank 1 exhaust VVT solenoid connector.",
      "Check wiring for opens, shorts and corrosion.",
      "Test solenoid resistance against manufacturer specifications.",
      "Verify power and control signals using the wiring diagram.",
      "Check engine oil condition and level."
    ]
  },
  P0014: {
    issue: "Exhaust camshaft timing over-advanced (Bank 1)",
    checks: [
      "Check oil level, condition and viscosity.",
      "Inspect the exhaust VVT solenoid.",
      "Compare actual and commanded exhaust camshaft timing.",
      "Check oil pressure and VVT oil passages.",
      "Inspect mechanical timing if necessary."
    ]
  },
  P0016: {
    issue: "Crankshaft/camshaft position correlation (Bank 1 Sensor A)",
    checks: [
      "Read all codes and freeze-frame information.",
      "Check engine oil condition and level.",
      "Inspect crankshaft and camshaft sensor connectors and wiring.",
      "Check camshaft/crankshaft synchronization using a compatible scan tool.",
      "Verify mechanical timing and timing-chain condition according to service information."
    ]
  },
  P0017: {
    issue: "Crankshaft/camshaft position correlation (Bank 1 Sensor B)",
    checks: [
      "Read all related trouble codes.",
      "Inspect crankshaft and exhaust camshaft sensor wiring.",
      "Check oil condition and VVT operation.",
      "Compare crankshaft and camshaft synchronization data.",
      "Inspect mechanical timing if sensor and VVT tests pass."
    ]
  },
  P0020: {
    issue: "Camshaft position actuator A control circuit (Bank 2)",
    checks: [
      "Confirm which cylinder bank is Bank 2.",
      "Inspect the Bank 2 intake VVT solenoid connector and wiring.",
      "Check engine oil condition and level.",
      "Test solenoid resistance and control circuit to manufacturer specifications.",
      "Verify VVT operation with a compatible scan tool."
    ]
  },
  P0021: {
    issue: "Camshaft timing over-advanced (Bank 2)",
    checks: [
      "Check engine oil level, viscosity and condition.",
      "Inspect the Bank 2 intake VVT solenoid.",
      "Compare commanded and actual camshaft timing.",
      "Check VVT oil passages and oil pressure.",
      "Verify mechanical timing if necessary."
    ]
  },
  P0022: {
    issue: "Camshaft timing over-retarded (Bank 2)",
    checks: [
      "Inspect oil level, condition and viscosity.",
      "Check the Bank 2 intake VVT solenoid and wiring.",
      "Check for restricted oil passages.",
      "Compare commanded and actual camshaft timing.",
      "Inspect timing components if the VVT system tests correctly."
    ]
  },
  P0087: {
    issue: "Fuel rail/system pressure too low",
    checks: [
      "Read freeze-frame data and related fuel-system codes.",
      "Check fuel level and inspect for external fuel leaks.",
      "Compare desired and actual fuel pressure using a compatible scan tool.",
      "Test fuel pressure with approved equipment following service procedures.",
      "Inspect fuel pump supply, filters, pressure regulator and sensors as applicable."
    ]
  },
  P0090: {
    issue: "Fuel pressure regulator 1 control circuit",
    checks: [
      "Read all related fuel-system codes.",
      "Inspect regulator connector and wiring for damage.",
      "Check circuit power, ground and control according to the wiring diagram.",
      "Test regulator electrical characteristics to manufacturer specifications.",
      "Verify commanded and actual fuel pressure."
    ]
  },
  P0104: {
    issue: "Mass or volume airflow circuit intermittent",
    checks: [
      "Inspect the MAF sensor connector for loose or corroded terminals.",
      "Inspect intake ducting for cracks and air leaks.",
      "Check the air filter and sensor for contamination.",
      "Monitor airflow readings while checking for intermittent wiring faults.",
      "Test sensor power, ground and signal using service specifications."
    ]
  },
  P0115: {
    issue: "Engine coolant temperature sensor circuit",
    checks: [
      "Check coolant level when the engine is cold.",
      "Inspect the coolant temperature sensor connector and wiring.",
      "Compare sensor reading with ambient temperature on a cold engine.",
      "Check sensor resistance or voltage according to manufacturer specifications.",
      "Verify temperature readings as the engine warms up."
    ]
  },
  P0116: {
    issue: "Engine coolant temperature sensor range/performance",
    checks: [
      "Compare cold-engine coolant temperature with ambient temperature.",
      "Monitor temperature changes during engine warm-up.",
      "Inspect the thermostat and cooling system operation.",
      "Check sensor wiring and connector condition.",
      "Test sensor response using manufacturer specifications."
    ]
  },
  P0117: {
    issue: "Engine coolant temperature sensor circuit low",
    checks: [
      "Inspect the sensor connector for moisture and corrosion.",
      "Check wiring for shorts according to the vehicle wiring diagram.",
      "Compare scan-tool coolant temperature with actual engine conditions.",
      "Test sensor resistance and signal voltage to specifications.",
      "Repair verified wiring or sensor faults."
    ]
  },
  P0118: {
    issue: "Engine coolant temperature sensor circuit high",
    checks: [
      "Inspect the sensor connector for loose or disconnected terminals.",
      "Check for open circuits and damaged wiring.",
      "Compare scan-tool coolant temperature with ambient temperature.",
      "Test sensor resistance and circuit voltage to specifications.",
      "Repair verified wiring or sensor faults."
    ]
  },
  P0128: {
    issue: "Coolant thermostat temperature below regulating temperature",
    checks: [
      "Check coolant level when the engine is completely cold.",
      "Compare coolant temperature with ambient temperature before starting.",
      "Monitor coolant temperature during warm-up.",
      "Inspect thermostat operation and cooling fan behavior.",
      "Verify temperature sensor readings before replacing the thermostat."
    ]
  },
  P0305: {
    issue: "Cylinder 5 misfire detected",
    checks: [
      "Read all misfire and fuel-system codes.",
      "Inspect cylinder 5 spark plug and ignition components.",
      "Test ignition coil operation using approved procedures.",
      "Check cylinder 5 injector operation and wiring.",
      "Test engine compression if ignition and fuel checks pass."
    ]
  },
  P0306: {
    issue: "Cylinder 6 misfire detected",
    checks: [
      "Read all misfire and fuel-system codes.",
      "Inspect cylinder 6 spark plug and ignition components.",
      "Test ignition coil operation using approved procedures.",
      "Check cylinder 6 injector operation and wiring.",
      "Test engine compression if ignition and fuel checks pass."
    ]
  }
});

renderCodes();

Object.assign(PRO_DIAGNOSTICS, {
  P0100: {
    issue: "Mass or volume air flow circuit malfunction",
    checks: ["Read stored codes and freeze-frame data.", "Inspect the MAF sensor connector and wiring.", "Check intake ducting for leaks after the sensor.", "Check sensor power, ground and signal against service data.", "Compare airflow readings with expected values."]
  },
  P0101: {
    issue: "Mass or volume air flow circuit range/performance",
    checks: ["Inspect the air filter and intake ducting.", "Check for intake leaks and restrictions.", "Inspect the MAF sensor for contamination.", "Compare MAF readings at idle and under load.", "Check related fuel-trim and airflow codes."]
  },
  P0102: {
    issue: "Mass or volume air flow circuit low input",
    checks: ["Inspect MAF wiring and connector.", "Check the sensor supply and ground circuits.", "Inspect for shorted or damaged signal wiring.", "Compare live MAF readings with specifications.", "Test the sensor using manufacturer procedures."]
  },
  P0103: {
    issue: "Mass or volume air flow circuit high input",
    checks: ["Inspect the MAF connector for damage.", "Check signal wiring for shorts to voltage.", "Verify sensor ground and supply voltage.", "Compare live airflow data with expected readings.", "Test or replace components only after confirming the fault."]
  },
  P0110: {
    issue: "Intake air temperature sensor circuit malfunction",
    checks: ["Read freeze-frame and related codes.", "Inspect the intake air temperature sensor connector.", "Check wiring for opens or shorts.", "Compare intake temperature with ambient temperature on a cold engine.", "Test sensor resistance or voltage using service specifications."]
  },
  P0112: {
    issue: "Intake air temperature sensor circuit low input",
    checks: ["Inspect sensor wiring and connector.", "Check for a signal short to ground.", "Compare cold-engine temperature readings with ambient.", "Test sensor resistance against the temperature chart.", "Repair confirmed circuit or sensor faults."]
  },
  P0113: {
    issue: "Intake air temperature sensor circuit high input",
    checks: ["Inspect the connector for loose or corroded terminals.", "Check for open circuits and signal shorts.", "Compare scan-tool temperature readings with ambient.", "Test sensor resistance and reference voltage.", "Repair confirmed wiring or sensor faults."]
  },
  P0120: {
    issue: "Throttle/pedal position sensor A circuit malfunction",
    checks: ["Read related throttle and pedal codes.", "Inspect throttle-body and pedal connectors.", "Check wiring, power and ground circuits.", "Monitor sensor signals for smooth changes.", "Follow vehicle-specific electronic throttle test procedures."]
  },
  P0121: {
    issue: "Throttle/pedal position sensor A range/performance",
    checks: ["Check for related electronic throttle codes.", "Inspect throttle body for deposits or binding.", "Monitor throttle and pedal position data.", "Check sensor signal correlation using service data.", "Perform any required relearn using approved procedures."]
  },
  P0122: {
    issue: "Throttle/pedal position sensor A circuit low input",
    checks: ["Inspect the sensor connector and harness.", "Check reference voltage and sensor ground.", "Test signal wiring for shorts to ground.", "Monitor live position readings.", "Repair confirmed wiring or sensor faults."]
  },
  P0123: {
    issue: "Throttle/pedal position sensor A circuit high input",
    checks: ["Inspect connectors for loose or damaged terminals.", "Check for signal shorts to voltage.", "Verify reference voltage and ground.", "Monitor sensor readings across the operating range.", "Use vehicle-specific diagnostics before replacing parts."]
  },
  P0130: {
    issue: "Oxygen sensor circuit malfunction (Bank 1 Sensor 1)",
    checks: ["Check for exhaust leaks before the sensor.", "Inspect the oxygen sensor connector and wiring.", "Check sensor signal and heater-related codes.", "Monitor oxygen sensor response with a scan tool.", "Verify fuel mixture issues before replacing the sensor."]
  },
  P0131: {
    issue: "Oxygen sensor circuit low voltage (Bank 1 Sensor 1)",
    checks: ["Inspect for exhaust leaks upstream.", "Check sensor connector and signal wiring.", "Review fuel trims and lean-condition codes.", "Monitor sensor voltage or current as applicable.", "Test the circuit using manufacturer specifications."]
  },
  P0132: {
    issue: "Oxygen sensor circuit high voltage (Bank 1 Sensor 1)",
    checks: ["Inspect oxygen sensor wiring for shorts.", "Check for rich fuel-mixture conditions.", "Review fuel trims and injector operation.", "Monitor sensor readings with a scan tool.", "Confirm circuit and mixture faults before replacement."]
  },
  P0133: {
    issue: "Oxygen sensor circuit slow response (Bank 1 Sensor 1)",
    checks: ["Check for intake and exhaust leaks.", "Inspect the sensor and connector.", "Review fuel trims and engine operating temperature.", "Check sensor response using approved scan-tool tests.", "Verify fuel-system performance before replacing the sensor."]
  },
  P0134: {
    issue: "Oxygen sensor circuit no activity detected (Bank 1 Sensor 1)",
    checks: ["Inspect the sensor connector and harness.", "Check related heater circuit faults.", "Verify sensor supply, ground and signal circuits.", "Monitor sensor activity after warm-up.", "Test the sensor according to manufacturer procedures."]
  },
  P0135: {
    issue: "Oxygen sensor heater circuit malfunction (Bank 1 Sensor 1)",
    checks: ["Inspect the oxygen sensor heater connector.", "Check the heater fuse and supply circuit.", "Inspect heater wiring for opens or shorts.", "Test heater resistance against specifications.", "Verify heater control operation before replacing parts."]
  },
  P0140: {
    issue: "Oxygen sensor circuit no activity detected (Bank 1 Sensor 2)",
    checks: ["Inspect the downstream sensor connector.", "Check signal wiring and related heater codes.", "Warm the engine and monitor sensor readings.", "Check for exhaust leaks or circuit damage.", "Test sensor operation using vehicle-specific procedures."]
  },
  P0141: {
    issue: "Oxygen sensor heater circuit malfunction (Bank 1 Sensor 2)",
    checks: ["Inspect downstream oxygen sensor wiring.", "Check heater supply and fuse.", "Test heater resistance to specifications.", "Verify heater control and ground circuits.", "Repair confirmed circuit or sensor faults."]
  },
  P0171: {
    issue: "System too lean (Bank 1)",
    checks: ["Read freeze-frame data and related codes.", "Inspect intake hoses and vacuum lines for leaks.", "Check MAF readings and fuel trims.", "Verify fuel pressure and delivery using approved procedures.", "Check exhaust leaks and injector operation before replacing parts."]
  }
});

renderCodes();
  
