//    ____                  _           __        __         _                     
//   / ___|  ___ _ ____   _(_) ___ ___  \ \      / /__  _ __| | _____ _ __         
//   \___ \ / _ \ '__\ \ / / |/ __/ _ \  \ \ /\ / / _ \| '__| |/ / _ \ '__|        
//    ___) |  __/ |   \ V /| | (_|  __/   \ V  V / (_) | |  |   <  __/ |           
//   |____/ \___|_|    \_/ |_|\___\___|    \_/\_/ \___/|_|  |_|\_\___|_|           
                                                                                
if ("serviceWorker" in navigator) {
    const registration = navigator.serviceWorker.register("/sw.js")
}

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
        brightspot.postMessage({
            'type': 'data_in',
            'procedures': window.procedures,
        })
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
        console.info(`SORT Calculator ran with data: \n${JSON.stringify(data, space="    ")}`)
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
        (parseInt(data['age']) >= 65 && parseInt(data['age']) <= 79) * 0.777 +
        (parseInt(data['age']) >= 80) * 1.591 -
        7.366
    )

    // if (data['asa'] == "3") console.debug('asa 3 -> 1.411')
    // if (data['asa'] == "4") console.debug('asa 4 -> 2.388')
    // if (data['asa'] == "5") console.debug('asa 5 -> 4.081')
    // if (data['urgency'] == "Expedited") console.debug('expedited -> 1.236')
    // if (data['urgency'] == "Urgent") console.debug('urgent -> 1.657')
    // if (data['urgency'] == "Immediate") console.debug('immediate -> 2.452')
    // if (data['tgv'] == "Yes") console.debug('tgv -> 0.712')
    // if (["Xma", "Com"].includes(severity)) console.debug('xmaj/complex -> 0.381')
    // if (data['malignancy'] == "Yes") console.debug('malignancy -> 0.667')
    // if (parseInt(data['age']) >= 65 && parseInt(data['age']) <= 79) console.debug('age 65-79 -> 0.777')
    // if (parseInt(data['age']) >= 80) console.debug('age ≤ 80 -> 1.591')
    // console.debug('-7.366')

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
    sortScoreOutput.dispatchEvent(new Event('input', {bubbles: true}))
})

//    ____                   _                                                     
//   | __ )  ___  __ _  __ _| | ___     ***           ****                         
//   |  _ \ / _ \/ _` |/ _` | |/ _ \   *   ***********    *                        
//   | |_) |  __/ (_| | (_| | |  __/   ***               *                         
//   |____/ \___|\__,_|\__, |_|\___|  *    ***********    *                        
//                     |___/           ****           ****                         

let beagle = new Worker("/beagle.js")
let boneList = document.querySelector('#warnings')
let suggestionsList = document.querySelector('#management-suggestions')
suggestionsList.currentSuggestions = {}

beagle.addEventListener('message', (m) => {
    console.info(m.data['type'], m.data)
    
    if (m.data['type'] == 'beagle-bone-add') {
        let toAdd = document.createElement('li')
        toAdd.setAttribute('beagle-bone-name', m.data.name)
        toAdd.setAttribute('clinic-text', m.data.name)
        toAdd.innerHTML = `<span>${m.data.name}${m.data?.severity == 'default' ? '' : ' (' + m.data?.severity +')' }</span><button tabindex="0">Add</button>`
        boneList.appendChild(toAdd)
    }
    
    if (m.data['type'] == 'beagle-bone-delete') {
        let staleIssue = document.querySelector(`[beagle-bone-name="${m.data.name}"]`)
        staleIssue?.remove()
    }
    
    if (m.data['type'] == 'beagle-suggestion-add') {
        let toAdd = document.createElement('li')
        toAdd.setAttribute('beagle-suggestion-name', m.data.suggestion)
        toAdd.setAttribute('clinic-text', m.data.suggestion)
        toAdd.innerHTML = `<span>${m.data.suggestion}</span><button tabindex="0">Add</button>`
        suggestionsList.appendChild(toAdd)
    }
    
    if (m.data['type'] == 'beagle-suggestion-delete') {
        let staleSuggestion = document.querySelector(`[beagle-suggestion-name="${m.data.suggestion}"]`)
        staleSuggestion?.remove()
    }
})

// SUGGESTIONS BOXES

let suggestionContainers = document.querySelectorAll('[clinic-suggestions-target]:not([clinic-suggestions-target=""])')
for (let s of suggestionContainers) {
    s.addEventListener('mousedown', (e) => { e.preventDefault() }) // prevent stealing focus
    let suggestionTextInput = document.querySelector(`[clinic-parameter="${s.getAttribute('clinic-suggestions-target')}"]`)
    s.addEventListener('click', (e) => {
        let li = e.target.closest('li')
        if (!li) return
        li.classList.add('added')
        suggestionTextInput.value = suggestionTextInput.value == "" ? `- ${li.getAttribute('clinic-text')}` : `${suggestionTextInput.value}\n- ${li.getAttribute('clinic-text')}`
        suggestionTextInput.dispatchEvent(new Event('input', {bubbles: true}))
    })
}

//    ____                      _                                                  
//   / ___|  ___  __ _ _ __ ___| |__                                               
//   \___ \ / _ \/ _` | '__/ __| '_ \                                              
//    ___) |  __/ (_| | | | (__| | | |                                             
//   |____/ \___|\__,_|_|  \___|_| |_|                                             
                                                                                
let brightspot = new Worker('/brightspot.js')
let searchForm = document.querySelector('#smart-search')
let searchResults = document.querySelector('#smart-results')
searchForm.addEventListener('submit', (e) => {
    e.preventDefault()
    let query = searchForm.querySelector('input[type="search"]')?.value
    if (!query) return
    brightspot.postMessage({
        'type': 'search',
        'query': query,
    })
})

brightspot.addEventListener('message', (m) => {
    let results = m.data

    if (results.length == 0) {
        searchResults.innerHTML = '<p style="text-align: center; font-weight: bold;">No results 🥺</p>'
        return
    }

    let newHTML = ''
    for (let r of results) {
        newHTML += `<li maingroup="${r.obj['MainGroup']}" subgroup="${r.obj['SubGroup']}"><span>${r.obj['SurgeryProcedure']}</span><button>Pick</button></li>\n`
    }
    searchResults.innerHTML = newHTML
})
searchResults.addEventListener('mousedown', (e) => {
    e.preventDefault() // stop focus stealing
})
searchResults.addEventListener('click', (e) => {
    let target = e.target.closest('li')
    if (!target) return

    let mainGroup = target.getAttribute('maingroup')
    let subGroup = target.getAttribute('subgroup')
    let operationName = target.querySelector('span')?.innerText

    if (!mainGroup || !subGroup || !operationName) return

    try {
        sortMainGroup.value = mainGroup
        sortMainGroup.dispatchEvent(new Event('change'))
    
        sortSubGroup.value = subGroup
        sortSubGroup.dispatchEvent(new Event('change'))
    
        sortOperation.value = operationName
        sortOperation.dispatchEvent(new Event('input', {bubbles: true}))

        sortMainGroup.focus()
    } catch (err) {
        console.error('failed to set operation using beagle result')
        console.error(err)
    }
})

//    _____                    _       _   _                                       
//   |_   _|__ _ __ ___  _ __ | | __ _| |_(_)_ __   __ _                           
//     | |/ _ \ '_ ` _ \| '_ \| |/ _` | __| | '_ \ / _` |                          
//     | |  __/ | | | | | |_) | | (_| | |_| | | | | (_| |                          
//     |_|\___|_| |_| |_| .__/|_|\__,_|\__|_|_| |_|\__, |                          
//                      |_|                        |___/                                     

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

        // abort if there is no template or [clinic-parameter] inputs
        if (!output) return
        if (inputs.length == 0) return

        // populate template with values from the <input> elements
        for (let i of inputs) {
            // printed value depends on <input> type
            let value = getAnyInputValue(i)

            // skip blank values and leave the template behind (will be cleaned up later)
            if (value == "") continue

            // replace in template (first instance only, you glutton)
            output = output.replace(`{{${i.getAttribute('clinic-parameter')}}}`, value)
        }

        // remove lines containing un-replaced templates
        let conditionalFinder = /^.*({{.*?}}).*$\n?/gm
        for (let c of output.matchAll(conditionalFinder)) {
            let stringtoReplace = c[0]
            output = output.replace(stringtoReplace, "")
        }

        // remove headers with nothing under them
        let pointlessHeaderFinder = /^## .+(?=\n*$)(?!\n[^#\s])\n*/gm
        for (let c of output.matchAll(pointlessHeaderFinder)) {
            let stringtoReplace = c[0]
            output = output.replace(stringtoReplace, "")
        }

        s.outputBox.innerText = output.trim()
    })
}

//     ____      _            _       _                                            
//    / ___|__ _| | ___ _   _| | __ _| |_ ___  _ __ ___                            
//   | |   / _` | |/ __| | | | |/ _` | __/ _ \| '__/ __|                           
//   | |__| (_| | | (__| |_| | | (_| | || (_) | |  \__ \                           
//    \____\__,_|_|\___|\__,_|_|\__,_|\__\___/|_|  |___/                           
   
let scoreInterpretationFunctions = {
    'apfel': (score) => {
        let risk
        if (score == 0) risk = '10'
        if (score == 1) risk = '21'
        if (score == 2) risk = '39'
        if (score == 3) risk = '61'
        if (score == 4) risk = '79'
        return `${risk}% 24-hour PONV risk`
    },
    'rcri': (score) => {
        let risk
        if (score == 0) risk = '3.9'
        if (score == 1) risk = '6.0'
        if (score == 2) risk = '10.1'
        if (score >= 3) risk = '15'
        return `${risk}% 30-day MACE risk`
    },
    'stopbang': (score) => {
        let risk
        if (score >= 0 && score <=2) risk = 'low'
        if (score >= 3 && score <=4) risk = 'intermediate'
        if (score >= 5) risk = 'high'
        return `${risk} OSA risk`
    },
}

let allCalculators = document.querySelectorAll('[clinic-calculator]')
for (let c of allCalculators) {
    c.output = c.querySelector('[clinic-calculator-output]')
    let interpreter = c.getAttribute('clinic-interpreter') || false
    if (interpreter && Object.keys(scoreInterpretationFunctions).includes(interpreter)) {
        c.interpreter = scoreInterpretationFunctions[interpreter]
    }
    c.checkboxes = c.querySelectorAll('input[type="checkbox"]')
    c.addEventListener('input', (e) => {
        // prevent autophagy
        if (e.target.matches('[clinic-calculator-output]')) return

        let score = 0
        for (let b of c.checkboxes) {
            score += b.checked ? 1 : 0
        }
        if (c.output) {
            // c.output.value = `${score} ${c.interpreter ? '(' + c.interpreter(score) + ')' : ''}`
            c.output.value = `${score}`
            // this event allows Beagle to interpret the final score
            c.output.dispatchEvent(new Event('input', {bubbles: true}))
        }
    })
}

// customElements.define('sim-readout', class extends HTMLElement {
//     constructor () {
//         super()
//         // listen for changes
//         self.inputs = self.querySelector('input')

//         // update score
//     }

//     attributeChangedCallback (name, oldValue, newValue) {

//     }
    
//     static get observedAttributes () {
//         return []
//     }
// })

//    _____         _     _____    _ _ _   _                                       
//   |_   _|____  _| |_  | ____|__| (_) |_(_)_ __   __ _                           
//     | |/ _ \ \/ / __| |  _| / _` | | __| | '_ \ / _` |                          
//     | |  __/>  <| |_  | |__| (_| | | |_| | | | | (_| |                          
//     |_|\___/_/\_\\__| |_____\__,_|_|\__|_|_| |_|\__, |                          
//                                                 |___/                           

// AUTO DOT POINTS
let validDotPoints = ['- ', '--> ']
let allTextAreas = document.querySelectorAll('textarea.bigbox')
for (let a of allTextAreas) {
    a.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') {
            let textarea = e.target
            let cursorPosition = textarea.selectionStart
            let currentLine = textarea.value.substring(0, cursorPosition).split('\n').pop().trim()
            let dotPoint
            for (let d of validDotPoints) {
                if (currentLine.startsWith(d)) {
                    dotPoint = d
                    break
                }
            }
        
            if (dotPoint) {
                let newLineText = `\n${dotPoint}`
                textarea.value = textarea.value.substring(0, cursorPosition) + newLineText + textarea.value.substring(cursorPosition)
                textarea.selectionStart = cursorPosition + newLineText.length
                textarea.selectionEnd = cursorPosition + newLineText.length
                textarea.closest('section')?.dispatchEvent(new Event('input'))
                e.preventDefault()
            }
        }
    })
}

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
// let osmrsBMI = document.querySelector('[clinic-parameter="osmrs-bmi"]')
bmiOutput.addEventListener('input', (e) => {
    let bmi = parseFloat(e.target.value)
    if (bmi > 35) {
        stopBangBMI.checked = true
    } else {
        stopBangBMI.checked = false
    }

    // if (bmi >= 50) {
    //     osmrsBMI.checked = true
    // } else {
    //     osmrsBMI.checked = false
    // }

    stopBangBMI.dispatchEvent(new Event('input', {'bubbles': true}))
    // osmrsBMI.dispatchEvent(new Event('input', {'bubbles': true}))
})

// SEX -> apfel, stopbang
let sexInput = document.querySelector('#anthropometry-sex')
let apfelSexOutput = document.querySelector('#apfel-sex')
let stopbangSexOutput = document.querySelector('#stopbang-sex')
// let osmrsSex = document.querySelector('[clinic-parameter="osmrs-sex"]')
sexInput.addEventListener('input', (e) => {
    if (sexInput.value == 'M') {
        apfelSexOutput.checked = false
        stopbangSexOutput.checked = true
        // osmrsSex.checked = true
    } else {
        apfelSexOutput.checked = true
        stopbangSexOutput.checked = false
        // osmrsSex.checked = false
    }
    apfelSexOutput.dispatchEvent(new Event('input', {'bubbles': true}))
    stopbangSexOutput.dispatchEvent(new Event('input', {'bubbles': true}))
    // osmrsSex.dispatchEvent(new Event('input', {'bubbles': true}))
})

// AGE -> stopbang, sort
let ageInput = document.querySelector('[clinic-parameter="age"]')
let stopbangAgeOutput = document.querySelector('#stopbang-age')
let sortAgeOutput = document.querySelector('#sort-age')
// let osmrsAge = document.querySelector('[clinic-parameter="osmrs-age"]')
ageInput.addEventListener('input', (e) => {
    let age = e.target.value

    if (age > 50) {
        stopbangAgeOutput.checked = true
    } else {
        stopbangAgeOutput.checked = false
    }
    stopbangAgeOutput.dispatchEvent(new Event('input', {'bubbles': true}))

    // if (age >= 45) {
    //     osmrsAge.checked = true
    // } else {
    //     osmrsAge.checked = false
    // }
    // osmrsAge.dispatchEvent(new Event('input', {'bubbles': true}))


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


//    ____        _          ____               _     _                            
//   |  _ \  __ _| |_ __ _  |  _ \ ___ _ __ ___(_)___| |_ ___ _ __   ___ ___       
//   | | | |/ _` | __/ _` | | |_) / _ \ '__/ __| / __| __/ _ \ '_ \ / __/ _ \      
//   | |_| | (_| | || (_| | |  __/  __/ |  \__ \ \__ \ ||  __/ | | | (_|  __/      
//   |____/ \__,_|\__\__,_| |_|   \___|_|  |___/_|___/\__\___|_| |_|\___\___|      

// get from localStorage at startup
let persistentDataStore
try {
    persistentDataStore = JSON.parse(localStorage.getItem('clinic-data') || '') // JSON parser chokes on empty string if clinic-data isn't stored
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
        localStorage.setItem('clinic-data', JSON.stringify(object))

        // Send to beagle for sniffing
        beagle.postMessage({
            inputData: object,
        })
    }
})

// display persisted data on load
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

// give Beagle its intial sniff
beagle.postMessage({
    inputData: persistentDataStore,
})

// listen for input events on any element with clinic-parameter
document.addEventListener('input', (e) => {
    if (e.target.hasAttribute('clinic-parameter')) {
        persistentDataProxy[e.target.getAttribute('clinic-parameter')] = getAnyInputValue(e.target)
    }
})



// let allSections = document.querySelectorAll('section')
// for (let s of allSections) {
//     s.dispatchEvent(new Event('input'))
// }

//    ____                                                                         
//   / ___| _   _ _ __   ___                                                       
//   \___ \| | | | '_ \ / __|                                                      
//    ___) | |_| | | | | (__                                                       
//   |____/ \__, |_| |_|\___|                                                      
//          |___/                                                                  

let allSyncedParameters = document.querySelectorAll('[clinic-sync]')
for (let i of allSyncedParameters) {
    i.addEventListener('input', (e) => {
        let allTargets = document.querySelectorAll(`[clinic-sync="${e.target.getAttribute('clinic-sync')}"]`)
        let value = getAnyInputValue(e.target)
        for (let t of allTargets) {
            if (t == e.target) continue
            setAnyInputValue(t, value)
            // prompt re-render of the enclosing <section>'s template
            t.closest('[clinic-calculator]')?.dispatchEvent(new Event('input')) // update calculators
            t.closest('section')?.dispatchEvent(new Event('input')) // render output
        }
    })
}

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
    let filename = `${formattedDate} ${document.querySelector('#umrn')?.value || 'Anonymous Patient'}.txt`

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
        localStorage.setItem('clinic-data', '{}')
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

//    _____         _     _____                            _                       
//   |_   _|____  _| |_  | ____|_  ___ __   __ _ _ __   __| | ___ _ __             
//     | |/ _ \ \/ / __| |  _| \ \/ / '_ \ / _` | '_ \ / _` |/ _ \ '__|            
//     | |  __/>  <| |_  | |___ >  <| |_) | (_| | | | | (_| |  __/ |               
//     |_|\___/_/\_\\__| |_____/_/\_\ .__/ \__,_|_| |_|\__,_|\___|_|               
//                                  |_|                                            

let shortcuts = [
    { shortcut: '!rx', expansion: 'Withhold mediations as per pharmacy letter' },
    { shortcut: '!rf', expansion: 'Routine fasting advice provided' },
    { shortcut: '!htn', expansion: 'Hypertension' },
    { shortcut: '!lip', expansion: 'Dyslipidaemia' },
    { shortcut: '!end', expansion: '- Routine fasting advice provided\n- Withhold mediations as per pharmacy letter' },
    { shortcut: '!ok', expansion: 'no issues with anaesthesia (PONV, FHx, airway disater, unplanned ICU admission, etc.)'}
]

document.body.addEventListener('input', (e) => {
    if (e.target.matches('textarea, input')) {
        let target = e.target
        let initialCursorPosition = target.selectionStart
        let precedingText = target.value.slice(0, initialCursorPosition)

        for (let s of shortcuts) {
            let shortcut = s['shortcut']
            if (precedingText.endsWith(shortcut)) {
                // get expansion
                let expansion = s['expansion']
                // manufacture new string
                let newText = target.value.slice(0, initialCursorPosition - shortcut.length) + expansion + target.value.slice(initialCursorPosition)
                // replace old string
                target.value = newText
                // fire input event
                target.closest('section')?.dispatchEvent(new Event('input'))
                // fix cursor position
                let newCursorPosition = initialCursorPosition - shortcut.length + expansion.length
                target.setSelectionRange(newCursorPosition, newCursorPosition)
            }
        }
    }
})

//   __        __   _                            _____         _                   
//   \ \      / /__| | ___ ___  _ __ ___   ___  |_   _|____  _| |_                 
//    \ \ /\ / / _ \ |/ __/ _ \| '_ ` _ \ / _ \   | |/ _ \ \/ / __|                
//     \ V  V /  __/ | (_| (_) | | | | | |  __/   | |  __/>  <| |_                 
//      \_/\_/ \___|_|\___\___/|_| |_| |_|\___|   |_|\___/_/\_\\__|                
                                                                                
let welcomeDialog = document.querySelector('#big-welcome')
window.addEventListener('load', (e) => {
    let todayDate = new Date().toISOString().slice(0,10)
    let storedDate = localStorage.getItem('clinic-last-welcome-date') || ''
    if (todayDate != storedDate) {
        welcomeDialog.showModal()
    }
    localStorage.setItem('clinic-last-welcome-date', todayDate)
})

//     ___        _      _           _       _     _                               
//    / _ \ _   _(_) ___| | __      / \   __| | __| |                              
//   | | | | | | | |/ __| |/ /____ / _ \ / _` |/ _` |                              
//   | |_| | |_| | | (__|   <_____/ ___ \ (_| | (_| |                              
//    \__\_\\__,_|_|\___|_|\_\   /_/   \_\__,_|\__,_|                              
        
let quickAddDialog = document.querySelector('#quick-add')
document.addEventListener("keydown", (e) => {
	let key = e.key.toLowerCase()
    if (key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        quickAddDialog.showModal()

    }
    if (key === "enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        document.querySelector('dialog[open]').close()
    }
})
quickAddDialog.addEventListener('keydown', (e) => {
    if (e.key == "Tab") {
        e.preventDefault()
        quickAddDialog.querySelector('textarea:not(:focus)')?.focus()
    }
})

//     ____ __  __ ____        _  __                                               
//    / ___|  \/  |  _ \      | |/ /                                               
//   | |   | |\/| | | | |_____| ' /                                                
//   | |___| |  | | |_| |_____| . \                                                
//    \____|_|  |_|____/      |_|\_\                                               

window.addEventListener('DOMContentLoaded', (e) => {
    let allInputs = document.querySelectorAll('[clinic-search]')
    document.allInputs = []
    for (let i of allInputs) {
        document.allInputs.push({
            'name': i.getAttribute('clinic-search') || 'Unknown Parameter',
            'element': i,
        })
    }
})

let quickFindDialog = document.querySelector('#quick-find')
let quickFindSearch = document.querySelector('#quick-find-input')
let quickFindResults = document.querySelector('#quick-find-results')
document.addEventListener("keydown", (e) => {
	let key = e.key.toLowerCase()
    if ((key === "k" && (e.metaKey || e.ctrlKey)) || key == "esc") {
        e.preventDefault()
        quickFindDialog.showModal()
    }
})
quickFindSearch.addEventListener('input', (e) => {
    let results = fuzzysort.go(e.target.value, document.allInputs, {key: 'name', limit: 5})
    quickFindResults.innerHTML = ''
    for (let r of results) {
        let li = document.createElement('li')
        li.innerHTML = `${r.obj['name']}<button tabindex="2">Go</button>`
        li.onclick = (e) => {
            // scroll into view and focus
            // setTimeout() seems to be required here
            r.obj['element'].scrollIntoView({ block: "center", inline: "nearest"})
            setTimeout(() => { r.obj['element'].focus() }, 0)
            // be gone
            quickFindDialog.close()
            // reset
            quickFindSearch.value = ''
            quickFindResults.innerHTML = ''
        }
        quickFindResults.appendChild(li)
        quickFindResults.firstChild.setAttribute('aria-selected', 'true')
    }
})
quickFindSearch.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        quickFindResults.querySelector('[aria-selected]')?.click()
    }
    if (e.key == "ArrowDown") {
        e.preventDefault()
        let currentlySelected = quickFindResults.querySelector('[aria-selected]')
        let nextElement = currentlySelected.nextElementSibling
        currentlySelected.removeAttribute('aria-selected')
        if (nextElement) {
            // go to next
            nextElement.setAttribute('aria-selected', 'true')
        } else {
            // go to top
            quickFindResults.firstElementChild.setAttribute('aria-selected', 'true')
        }
    }
    if (e.key == "ArrowUp") {
        e.preventDefault()
        let currentlySelected = quickFindResults.querySelector('[aria-selected]')
        let previousElement = currentlySelected.previousElementSibling
        currentlySelected.removeAttribute('aria-selected')
        if (previousElement) {
            // go to next
            previousElement.setAttribute('aria-selected', 'true')
        } else {
            // go to top
            quickFindResults.lastElementChild.setAttribute('aria-selected', 'true')
        }
    }
})

let shortcutsMenu = document.querySelector('#shortcuts-menu')
shortcutsMenu.addEventListener('change', (e) => {
    let option = e.target.options[e.target.selectedIndex]
    option.click()
    e.target.value = 'initial'
})

document.querySelector('#quick-find-button')?.addEventListener('click', (e) => {
    quickFindDialog.showModal()
})
document.querySelector('#quick-add-button')?.addEventListener('click', (e) => {
    quickAddDialog.showModal()
})