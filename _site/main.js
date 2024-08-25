
let beagle = new Worker("/beagle.js")

//    ____                _           _                                            
//   |  _ \ ___ _ __   __| | ___ _ __(_)_ __   __ _                                
//   | |_) / _ \ '_ \ / _` |/ _ \ '__| | '_ \ / _` |                               
//   |  _ <  __/ | | | (_| |  __/ |  | | | | | (_| |                               
//   |_| \_\___|_| |_|\__,_|\___|_|  |_|_| |_|\__, |                               
//                                            |___/                                       

function getAnyInputValue(inputElement) {
    if (inputElement.tagName == 'select' && inputElement.selectedIndex > 0) {
        return inputElement.value
    } else if (inputElement.tagName == 'INPUT' && inputElement.getAttribute('type') == 'checkbox') {
        return inputElement.checked
    } else {
        return inputElement.value
    }
}

function setAnyInputValue(inputElement, value) {
    if (inputElement.tagName == 'select' && inputElement.selectedIndex > 0) {
        inputElement.value = value
    } else if (inputElement.tagName == 'INPUT' && inputElement.getAttribute('type') == 'checkbox') {
        inputElement.checked = value
    } else {
        inputElement.value = value
    }
}

// RENDER TEXT ON INPUT
let sections = document.querySelectorAll('section')
for (let s of sections) {
    s.template = s.querySelector('template')?.content.textContent
    s.outputBox = s.querySelector('.rendered-template')

    s.addEventListener('input', (e) => {
        let inputs = s.querySelectorAll('[clinic-parameter]')
        let output = s.template

        // abort is ther is no template
        if (!output) return
        if (inputs.length == 0) return

        // populate template with values from the <input> elements
        for (let i of inputs) {
            // printed value depends on <input> type
            let value = getAnyInputValue(i)

            // skip blank ones
            // it'll leave the template behind
            // which will (along with the entire line) be cleaned up later
            if (value == "") {
                continue
            }

            // replace in template (first instance only)
            output = output.replace(`{{${i.getAttribute('clinic-parameter')}}}`, value)
        }

        // remove lines containing un-replaced templates
        let conditionalFinder = /^.*({{.*?}}).*$\n?/gm
        for (let c of output.matchAll(conditionalFinder)) {
            let stringtoReplace = c[0]
            output = output.replace(stringtoReplace, "")
        }

        s.outputBox.innerText = output.trim()

        beagle.postMessage({
            parameter: e.target.getAttribute('clinic-parameter'),
            value: getAnyInputValue(e.target),
        })
    })
}

// CALCULATORS
let allCalculators = document.querySelectorAll('[paas-calculator]')
for (let c of allCalculators) {
    c.output = c.querySelector('[paas-calculator-output]')
    c.checkboxes = c.querySelectorAll('input[type="checkbox"]')
    c.addEventListener('input', (e) => {
        let score = 0
        for (let b of c.checkboxes) {
            score += b.checked ? 1 : 0
        }
        if (c.output) {
            c.output.value = score
        }
    })
}

//    _____         _     _____    _ _ _   _                                       
//   |_   _|____  _| |_  | ____|__| (_) |_(_)_ __   __ _                           
//     | |/ _ \ \/ / __| |  _| / _` | | __| | '_ \ / _` |                          
//     | |  __/>  <| |_  | |__| (_| | | |_| | | | | (_| |                          
//     |_|\___/_/\_\\__| |_____\__,_|_|\__|_|_| |_|\__, |                          
//                                                 |___/                           

// AUTO DOT POINTS
let allTextAreas = document.querySelectorAll('textarea.bigbox')
for (let a of allTextAreas) {
    a.addEventListener('keydown', (e) => {
        const textarea = e.target
        const cursorPosition = textarea.selectionStart
        const currentLine = textarea.value.substring(0, cursorPosition).split('\n').pop()
    
        if (e.key == 'Enter' && currentLine.trim().startsWith('- ')) {
            const newLineText = '\n- '
            textarea.value = textarea.value.substring(0, cursorPosition) + newLineText + textarea.value.substring(cursorPosition)
            textarea.selectionStart = cursorPosition + newLineText.length
            textarea.selectionEnd = cursorPosition + newLineText.length
            textarea.closest('section').dispatchEvent(new Event('input'))
            e.preventDefault()
        }
    })
}

//    ____                    _     _       _                                      
//   |  _ \  ___  ___ _ __   | |   (_)_ __ | | _____                               
//   | | | |/ _ \/ _ \ '_ \  | |   | | '_ \| |/ / __|                              
//   | |_| |  __/  __/ |_) | | |___| | | | |   <\__ \                              
//   |____/ \___|\___| .__/  |_____|_|_| |_|_|\_\___/                              
//                   |_|                                                           

// let deepLinkTemplates = {
//     'bossnet':         'https://dmr.hdwa.health.wa.gov.au/bossfunctionlauncher/BOSSFunctionLaunch.aspx?appkey=WEBPAS&function=14000&urn=A1234567',
//     'nacs':            'https://nacs.hdwa.health.wa.gov.au/#umrn-A1234567',
//     'ereferrals':      'https://ereferrals.hdwa.health.wa.gov.au/Patient/Overview?umrn=A1234567',
//     'inteleconnect':   'https://inteleconnect.hdwa.health.wa.gov.au/Portal/app#patients/A1234567',
// }
// let umrnInput = document.getElementById('umrn')
// umrnInput.addEventListener('input', (e) => {
//     let umrnTester = /^[A-Za-z]\d{7}$/
//     let valid = umrnTester.test(e.target.value)
//     if (valid == true) {
//         for (let t in deepLinkTemplates) {
//             let targetLink = document.querySelector(`[deeplink="${t}"]`)
//             let href = deepLinkTemplates[t].replace('A1234567', e.target.value)
//             targetLink.setAttribute('value', href)
//             targetLink.removeAttribute('disabled')
//         }
//     } else {
//         let deeplinks = document.querySelectorAll('[deeplink]')
//         for (let d of deeplinks) {
//             d.removeAttribute('value')
//             d.setAttribute('disabled', 'true')
//         }
//     }
// })

// let deepLinkDropdown = document.querySelector('#deeplinks')
// deepLinkDropdown.addEventListener('change', (e) => {
//     window.open(e.target.value, '_blank')
//     e.target.selectedIndex = 0
// })

//    ____                  _       _    ____                                      
//   / ___| _ __   ___  ___(_) __ _| |  / ___|__ _ ___  ___  ___                   
//   \___ \| '_ \ / _ \/ __| |/ _` | | | |   / _` / __|/ _ \/ __|                  
//    ___) | |_) |  __/ (__| | (_| | | | |__| (_| \__ \  __/\__ \                  
//   |____/| .__/ \___|\___|_|\__,_|_|  \____\__,_|___/\___||___/                  
//         |_|                                                                     

// BMI CALCULATOR
let weightInput = document.querySelector('#weight')
let heightInput = document.querySelector('#height')
let bmiOutput = document.querySelector('#bmi')
for (let i of [weightInput, heightInput]) {
    i.addEventListener('input', (e) => {
        let w = parseInt(weightInput.value)
        let h = parseInt(heightInput.value)

        let output
        if (w == undefined || h == undefined) {
            output = ''
        } else {
            output = w / (h/100)**2
        }

        if (isNaN(output) == false) {
            bmiOutput.value = output.toFixed(1)
        } else {
            bmiOutput.value = ''
        }

        // dispatch event to prompt saving to localStorage
        // bubbles because the relevant event listener is attached to the parent <section>, not the <input>
        bmiOutput.dispatchEvent(new Event('input', { bubbles: true }))
    })
}

// BMI -> stopbang
let stopBangBMI = document.querySelector('#stopbang-bmi')
let osmrsBMI = document.querySelector('[clinic-parameter="osmrs-bmi"]')
bmiOutput.addEventListener('input', (e) => {
    let bmi = parseFloat(e.target.value)
    if (bmi > 35) {
        stopBangBMI.checked = true
    } else {
        stopBangBMI.checked = false
    }

    if (bmi >= 50) {
        osmrsBMI.checked = true
    } else {
        osmrsBMI.checked = false
    }

    stopBangBMI.dispatchEvent(new Event('input', {'bubbles': true}))
    osmrsBMI.dispatchEvent(new Event('input', {'bubbles': true}))
})

// SEX -> apfel, stopbang
let sexInput = document.querySelector('#anthropometry-sex')
let apfelSexOutput = document.querySelector('#apfel-sex')
let stopbangSexOutput = document.querySelector('#stopbang-sex')
let osmrsSex = document.querySelector('[clinic-parameter="osmrs-sex"]')
sexInput.addEventListener('input', (e) => {
    if (sexInput.value == 'M') {
        apfelSexOutput.checked = false
        stopbangSexOutput.checked = true
        osmrsSex.checked = true
    } else {
        apfelSexOutput.checked = true
        stopbangSexOutput.checked = false
        osmrsSex.checked = false
    }
    apfelSexOutput.dispatchEvent(new Event('input', {'bubbles': true}))
    stopbangSexOutput.dispatchEvent(new Event('input', {'bubbles': true}))
    osmrsSex.dispatchEvent(new Event('input', {'bubbles': true}))
})

// AGE -> stopbang, sort
let ageInput = document.querySelector('[clinic-parameter="age"]')
let stopbangAgeOutput = document.querySelector('#stopbang-age')
let sortAgeOutput = document.querySelector('#sort-age')
let osmrsAge = document.querySelector('[clinic-parameter="osmrs-age"]')
ageInput.addEventListener('input', (e) => {
    sortAgeOutput.value = e.target.value
    let age = e.target.value

    if (age > 50) {
        stopbangAgeOutput.checked = true
    } else {
        stopbangAgeOutput.checked = false
    }
    stopbangAgeOutput.dispatchEvent(new Event('input', {'bubbles': true}))

    if (age >= 45) {
        osmrsAge.checked = true
    } else {
        osmrsAge.checked = false
    }
    osmrsAge.dispatchEvent(new Event('input', {'bubbles': true}))


})

// SMOKING -> apfel
let smokingInput = document.querySelector('[clinic-parameter="smoking"')
let apfelSmokingOutput = document.querySelector('#apfel-smoking')
smokingInput.addEventListener('input', (e) => {
    if (e.target.value != 'active smoker') {
        apfelSmokingOutput.checked = true
    } else {
        apfelSmokingOutput.checked = false
    }
})

//    ____   ___  ____ _____   ____                                                
//   / ___| / _ \|  _ \_   _| / ___|  ___ ___  _ __ ___                            
//   \___ \| | | | |_) || |   \___ \ / __/ _ \| '__/ _ \                           
//    ___) | |_| |  _ < | |    ___) | (_| (_) | | |  __/                           
//   |____/ \___/|_| \_\|_|   |____/ \___\___/|_|  \___|                           
                                                                                
window.addEventListener('load', async (e) => {
    try {
        const response = await fetch('/oplist.json')
        if (!response.ok) {
            throw new Error(`HTTP error while downloading operation list. Status: ${response.status}`)
        }
        window.procedures = await response.json()
    } catch (error) {
        console.error('Error while downloading operation list:', error);
    }
})

let sortMainGroup = document.querySelector('#sort-maingroup')
let sortSubGroup = document.querySelector('#sort-subgroup')
let sortOperation = document.querySelector('#sort-operation')

sortMainGroup.addEventListener('change', (e) => {
    // filter operations
    let subGroups = window.procedures.filter((p) => {
        return p['MainGroup'] ==  e.target.value
    })
    subGroups = subGroups.map((g) => g['SubGroup'])
    subGroups = subGroups.sort()
    subGroups = new Set(subGroups)
    
    // reset sub-group
    sortSubGroup.innerHTML = ""

    // add non-option
    let nonOption = document.createElement('option')
    nonOption.value = ""
    nonOption.setAttribute('disabled', true)
    nonOption.setAttribute('selected', true)
    sortSubGroup.appendChild(nonOption)

    // render an <option> for each of the subgroups
    for (let g of subGroups) {
        let optionElement = document.createElement('option')
        optionElement.value = g
        optionElement.innerText = g
        sortSubGroup.appendChild(optionElement)
    }

    sortSubGroup.dispatchEvent(new Event('change'))
})

sortSubGroup.addEventListener('change', (e) => {
    // filter operations
    let operations = window.procedures.filter((p) => {
        return p['SubGroup'] ==  e.target.value
    })
    operations = operations.map((g) => g['SurgeryProcedure'])
    operations = operations.sort()
    operations = new Set(operations)
    
    // reset sub-group
    sortOperation.innerHTML = ""

    // add non-option
    let nonOption = document.createElement('option')
    nonOption.value = ""
    nonOption.setAttribute('disabled', true)
    nonOption.setAttribute('selected', true)
    sortOperation.appendChild(nonOption)

    // render an <option> for each of the operations
    for (let o of operations) {
        let optionElement = document.createElement('option')
        optionElement.value = o
        optionElement.innerText = o
        sortOperation.appendChild(optionElement)
    }
})

function calculateSortScore(data) {
    // requires: asa urgency tgv severity malignancy age
    // unless all keys are present, log error and return empty string
    let requiredKeys = ['asa', 'age', 'urgency', 'tgv', 'operation', 'malignancy']
    let hasRequiredKeys = requiredKeys.every((i) => { return data.hasOwnProperty(i) })
    if (hasRequiredKeys == false) {
        console.debug('SORT not calculated due to incomplete data:', data)
        return ""
    } else {
        console.info(`SORT Calculator started with data: \n${JSON.stringify(data, space="    ")}`)
    }

    // get operation severity
    let operationData = window.procedures.filter((p) => { return p['SurgeryProcedure'] == data['operation'] })
    let severity = operationData[0]['SurgeryProcedureSeverity']

    let sortlogit = (
        (data['asa'] == "3") * 1.411 +
        (data['asa'] == "4") * 2.388 +
        (data['asa'] == "5") * 4.081 +
        (data['urgency'] == "Expedited") * 1.236 +
        (data['urgency'] == "Urgent") * 1.657 +
        (data['urgency'] == "Immediate") * 2.452 +
        (data['tgv'] == "Yes") * 0.712 +
        (["Xma", "Com"].includes(severity)) * 0.381 +
        (data['malignancy'] == "Yes") * 0.667 +
        (65 <= parseInt(data['age']) <= 79) * 0.777 +
        (parseInt(data['age']) >= 80) * 1.591 -
        7.366
    )

    let sortScore =  100 / (1 + Math.E**(0-sortlogit))

    return sortScore.toFixed(2)
}

let sortScoreOutput = document.querySelector('[clinic-parameter="sort-score"')
let sortContainer = document.querySelector('#sort-container')

sortContainer?.addEventListener('input', (e) => {
    let requiredData = {'asa': null, 'age': null, 'urgency': null, 'tgv': null, 'operation': null, 'malignancy': null}
    for (let k in requiredData) {
        let targetElement = sortContainer.querySelector(`[clinic-parameter="${k}"]`)
        let value = getAnyInputValue(targetElement)
        
        if (value != "") {
            requiredData[k] = value
        } else {
            sortScoreOutput.value = ""
            return
        }
    }

    sortScoreOutput.value = calculateSortScore(requiredData)
})

//    ____        _          ____               _     _                            
//   |  _ \  __ _| |_ __ _  |  _ \ ___ _ __ ___(_)___| |_ ___ _ __   ___ ___       
//   | | | |/ _` | __/ _` | | |_) / _ \ '__/ __| / __| __/ _ \ '_ \ / __/ _ \      
//   | |_| | (_| | || (_| | |  __/  __/ |  \__ \ \__ \ ||  __/ | | | (_|  __/      
//   |____/ \__,_|\__\__,_| |_|   \___|_|  |___/_|___/\__\___|_| |_|\___\___|      

// get from localStorage at startup
let persistentDataStore
try {
    persistentDataStore = JSON.parse(localStorage.getItem('paas-data') || '') // JSON parser chokes on empty string if paas-data isn't stored
} catch {
    persistentDataStore = {}
}

// establish proxy
let persistentDataProxy = new Proxy(persistentDataStore, {
    get(object, key, receiver) {
        return object[key]
    },
    set(object, key, value) {
        // Update UI

        // Update data model
        object[key] = value

        // Emit event

        // Persist data
        localStorage.setItem('paas-data', JSON.stringify(object))
    }
})

// listen for input events on any element with clinic-parameter
document.addEventListener('input', (e) => {
    if (e.target.hasAttribute('clinic-parameter')) {
        persistentDataProxy[e.target.getAttribute('clinic-parameter')] = getAnyInputValue(e.target)
    }
})

// TOP BAR
document.addEventListener('input', (e) => {
    let name = persistentDataProxy['fullname'] || ''
    let umrn = persistentDataProxy['umrn'] || ''
    let target = e.target.getAttribute('clinic-parameter') || ''
    if (['umrn', 'fullname'].includes(target)) {

        document.querySelector('#patient-details').innerText = `${name.length > 0 ? name : 'Clinic Helper'} ${name.length > 0 && umrn.length == 8 ? umrn : ''}`
    }
})

let allSections = document.querySelectorAll('section')
for (let s of allSections) {
    s.dispatchEvent(new Event('input'))
}

//    ____                                                                         
//   / ___| _   _ _ __   ___                                                       
//   \___ \| | | | '_ \ / __|                                                      
//    ___) | |_| | | | | (__                                                       
//   |____/ \__, |_| |_|\___|                                                      
//          |___/                                                                  

document.addEventListener('input', (e) => {
    if (e.target.hasAttribute('paas-sync')) {
        let allTargets = document.querySelectorAll(`[paas-sync="${e.target.getAttribute('paas-sync')}"]`)
        let value = getAnyInputValue(e.target)
        for (let t of allTargets) {
            if (t == e.target) continue
            setAnyInputValue(t, value)
            // prompt re-render of the enclosing <section>'s template
            t.closest('section').dispatchEvent(new Event('input'))
        }
    }
})

//    ____                      _                 _                                
//   |  _ \  _____      ___ __ | | ___   __ _  __| | ___ _ __                      
//   | | | |/ _ \ \ /\ / / '_ \| |/ _ \ / _` |/ _` |/ _ \ '__|                     
//   | |_| | (_) \ V  V /| | | | | (_) | (_| | (_| |  __/ |                        
//   |____/ \___/ \_/\_/ |_| |_|_|\___/ \__,_|\__,_|\___|_|                        

function downloadDocument() {
    // JS really needs better date string formatting tools
    let today = new Date()
    let year = today.getFullYear()
    let month = String(today.getMonth() + 1).padStart(2, '0')
    let day = String(today.getDate()).padStart(2, '0')
    let formattedDate = `${year}-${month}-${day}`

    // Fabricate a filename (date + UMRN)
    let filename = `${formattedDate} ${document.querySelector('#umrn').value || 'Anonymous Patient'}.txt`

    // Create a text dump
    let textDump = ''
    for (let o of document.querySelectorAll('div.output')) {
        textDump += o.innerText.trim() + '\n\n'
    }

    // Create sham download link
	let downloadLink = document.createElement('a')
	downloadLink.setAttribute('href','data:text/plain;charset=utf-8,' + encodeURIComponent(textDump))
    downloadLink.setAttribute('download', filename)
	downloadLink.style.display = "none"
	document.body.appendChild(downloadLink)

    // Pull the lever, Kronk
	downloadLink.click()
}

document.querySelector('#download')?.addEventListener('click', (e) => {
    downloadDocument()
})

// RESET
document.querySelector('#reset')?.addEventListener('click', (e) => {
    if (confirm('Are you sure you want to reset the page?')) {
        downloadDocument()
        localStorage.setItem('paas-data', '{}')
        window.location.reload()
    }
})

//     ____                    ____        _   _                                   
//    / ___|___  _ __  _   _  | __ ) _   _| |_| |_ ___  _ __  ___                  
//   | |   / _ \| '_ \| | | | |  _ \| | | | __| __/ _ \| '_ \/ __|                 
//   | |__| (_) | |_) | |_| | | |_) | |_| | |_| || (_) | | | \__ \                 
//    \____\___/| .__/ \__, | |____/ \__,_|\__|\__\___/|_| |_|___/                 
//              |_|    |___/                                                       

let allOutputs = document.querySelectorAll('.output')
for (let o of allOutputs) {
    // prevent copy button rom stealing focus
    o.querySelector('.copy')?.addEventListener('mousedown', (e) => {
        e.preventDefault()
    })

    // copy output text (when output OR button is clicked)
    o.addEventListener('click', (e) => {
        navigator.clipboard.writeText(o.innerText.trim())
    })
}

//     ____                           _                                            
//    / ___|___  _ __  ___  ___ _ __ | |_                                          
//   | |   / _ \| '_ \/ __|/ _ \ '_ \| __|                                         
//   | |__| (_) | | | \__ \  __/ | | | |_                                          
//    \____\___/|_| |_|___/\___|_| |_|\__|                                         
                                 

const consentSnippets = {
    'consent-ga': `Discussed risks and benefits of GA by prevalence.  

- VERY COMMON: sore throat (45% ETT, 20% LMA), PONV
- COMMON: minor lip/tongue injury (1 in 100)
- RARE: damage to teeth, severe allergy, nerve damage
- VERY RARE: awareness, death (1 in 100,000 ASA 1, 1 in 50,000 for all ASAs)

Specific risks including aspiration, LRTI, post op confusion, covert CVA with possible cognitive changes, temporary memory loss, myocardial infarction also discussed.`,
    'consent-sedation': `Consented for sedation, with risks discussed including death, failure, allergy, awareness, pain and need to progress to GA with its associated risks.`,
    'consent-regional': `Regional risks discussed - superficial skin infection, bleeding, nerve damage (parasthesia and/or paralysis), failure of block, damage to surrounding structures, adverse drug reactions.`,
    'consent-neuraxial': `Discussed risks and benefits of neuraxial anaesthesia. Specifically, nausea and vomiting, backache, headache, prolonged numbness or tingling, hypotension, urinary retention, nerve injury (1 in 500 temporary, ~1 in 25,000 permanent) and failure of regional technique.`,
    'consent-blood': `Consented to blood products.`,
    'consent-artline': `Consented to arterial line placement. Risks discussed include infection, bleeding, nerve damage (parasthesia and/or paralysis, damage to surrounding structures, adverse drug reactions, compartment syndrome, distal ischaemia.`,
    'consent-cvc': `Consented to central line placement. Risks discussed include infection, bleeding, arterial puncture, pneumothorax, thrombosis, air embolism, pain, vessel damage, arrhythmia.`,
}
let consentSwitchBox = document.querySelector('div#consent')
let consentSwitches = consentSwitchBox.querySelectorAll('input[type="checkbox"]')
let consentOutput = consentSwitchBox.querySelector('[clinic-parameter="consent-output"]')
consentSwitchBox.addEventListener('input', (e) => {
    output = ''
    for (let s of consentSwitches) {
        if (s.checked == true) {
            let consentType = s.getAttribute('clinic-parameter')
            let consentSnippet = consentSnippets[consentType]
            output += consentSnippet
            output += '\n\n'
        }
    }
    consentOutput.value = output
    consentOutput.dispatchEvent(new Event('input'))
})

// INIT

let allInputs = document.querySelectorAll('[clinic-parameter]')
for (let i of allInputs) {
    // apply any stored values
    let parameter = i.getAttribute('clinic-parameter')
    let storedValue = persistentDataProxy[parameter]
    if (storedValue) {
        setAnyInputValue(i, storedValue)
    }
    // dispatch input event
    i.dispatchEvent(new Event('input', {'bubbles': true}))
}