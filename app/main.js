// const { text } = require("stream/consumers")

window.addEventListener('load', () => {
    applySyncInputListeners()
    applyCalculatorListeners()
})

// SYNCHRONISES ANY TWO <input> ELEMENTS WITH THE SAME [paas-sync-parameter]
function applySyncInputListeners() {
    // get all elements with [paas-sync-parameter]
    let allSynchronisedInputs = document.querySelectorAll('[paas-sync-parameter]')
    // iterate…
    for (let i of allSynchronisedInputs) {
        // add an 'input' event listener to each
        i.addEventListener('input', (e) => {
            // find target parameter
            let syncParameter = e.target.getAttribute('paas-sync-parameter')

            console.log(`syncing data for all <input> elements with [paas-sync-parameter="${syncParameter}"]`)

            // find all elements with same parameter
            let similarInputs = document.querySelectorAll(`[paas-sync-parameter="${syncParameter}"]`)
            // update this value in each
            for (let s of similarInputs) {
                if (e.target.getAttribute('type') == 'checkbox') {
                    s.checked = e.target.checked
                } else {
                    s.value = e.target.value
                }
            }
        })
    }
}

function applyCalculatorListeners() {
    // find all calculator outputs
    let allCalculatorDisplays = document.querySelectorAll('[paas-calculator-output]')

    for (let d of allCalculatorDisplays) {
        // find all inputs
        let calculatorFunctionName = d.getAttribute('paas-calculator-output')
        let allContributingInputs = document.querySelectorAll(`[paas-calculator="${calculatorFunctionName}"]`)
        for (let i of allContributingInputs) {
            i.addEventListener('input', (e) => {
                let outputElement = d
                let calculatorFunction = paasCalculators[calculatorFunctionName]
                let result = calculatorFunction(allContributingInputs)
                outputElement.innerText = result
                outputElement.setAttribute('value', result)
            })
        }
    }
}

let paasCalculators = {
    'stopbang': (elements) => {
        let total = 0
        for (let e of elements) {
            let value = e.getAttribute('paas-value')
            value = parseInt(value)
            if (e.checked == true) {
                total += value
            }
        }
        return total
    },
    'apfel': (elements) => {
        let total = 0
        for (let e of elements) {
            let value = e.getAttribute('paas-value')
            value = parseInt(value)
            if (e.checked == true) {
                total += value
            }
        }
        return total
    },
    'rcri': (elements) => {
        let total = 0
        for (let e of elements) {
            let value = e.getAttribute('paas-value')
            value = parseInt(value)
            if (e.checked == true) {
                total += value
            }
        }
        return total
    },
}

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

        bmiOutput.value = output.toFixed(1)
        bmiOutput.dispatchEvent(new Event('input'))
    })
}

bmiOutput.addEventListener('input', (e) => {
    let stopBangBMI = document.querySelector('#stopbang-bmi')
    if (parseFloat(e.target.value) > 35) {
        stopBangBMI.checked = true
    } else {
        stopBangBMI.checked = false
    }
})

let sexInput = document.querySelector('#anthropometry-sex')
let apfelSexOutput = document.querySelector('#apfel-sex')
let stopbangSexOutput = document.querySelector('#stopbang-sex')
sexInput.addEventListener('input', (e) => {
    if (sexInput.value == 'm') {
        apfelSexOutput.checked = false
        stopbangSexOutput.checked = true
    } else {
        apfelSexOutput.checked = true
        stopbangSexOutput.checked = false
    }
    apfelSexOutput.dispatchEvent(new Event('input'))
    stopbangSexOutput.dispatchEvent(new Event('input'))
})

// DOT POINTS
let allTextAreas = document.querySelectorAll('textarea.bigbox')
for (let a of allTextAreas) {
    a.addEventListener('keydown', (e) => {
        newDotPoint(e)
    })
}
function newDotPoint(event) {
    const textarea = event.target
    const cursorPosition = textarea.selectionStart
    const currentLine = textarea.value.substring(0, cursorPosition).split('\n').pop()

    if (event.key == 'Enter' && currentLine.trim().startsWith('- ')) {
        const newLineText = '\n- ';
        textarea.value = textarea.value.substring(0, cursorPosition) + newLineText + textarea.value.substring(cursorPosition)
        textarea.selectionStart = cursorPosition + newLineText.length;
        textarea.selectionEnd = cursorPosition + newLineText.length;
        event.preventDefault();
    }
}

// DEEP LINKS
let deepLinkTemplates = {
    'bossnet':         'https://dmr.hdwa.health.wa.gov.au/bossfunctionlauncher/BOSSFunctionLaunch.aspx?appkey=WEBPAS&function=14000&urn=A1234567',
    'nacs':            'https://nacs.hdwa.health.wa.gov.au/#umrn-A1234567',
    'ereferrals':      'https://ereferrals.hdwa.health.wa.gov.au/Patient/Overview?umrn=A1234567',
    'inteleconnect':   'https://inteleconnect.hdwa.health.wa.gov.au/Portal/app#patients/A1234567',
}
let umrnInput = document.getElementById('umrn')
let deeplinksButton = document.querySelector('#deeplinks')
umrnInput.addEventListener('input', (e) => {
    let umrnTester = /^[A-Za-z]\d{7}$/
    let valid = umrnTester.test(e.target.value)
    if (valid == true) {
        for (let t in deepLinkTemplates) {
            let targetLink = document.querySelector(`[deeplink="${t}"]`)
            let href = deepLinkTemplates[t].replace('A1234567', e.target.value)
            targetLink.setAttribute('target', "_blank")
            targetLink.setAttribute('href', href)
            targetLink.setAttribute('aria-disabled', 'false')
            targetLink.style = 'pointer-events: auto;'
            // deeplinksButton.classList.add('contrast')
            // deeplinksButton.classList.remove('secondary')
            // deeplinksButton.classList.remove('outline')
        }
    } else {
        let deeplinks = document.querySelectorAll('[deeplink]')
        for (let d of deeplinks) {
            d.setAttribute('aria-disabled', 'true')
            d.removeAttribute('href')
            // deeplinksButton.classList.add('secondary')
            // deeplinksButton.classList.add('outline')
            // deeplinksButton.classList.remove('contrast')
        }
    }
})

// TEMPLATE

const consentSnippets = {
    'consent-ga': `Discussed risks and benefits of GA by prevalence.  

- VERY COMMON: sore throat (45% ETT, 20% LMA), PONV
- COMMON: minor lip/tongue injury (1 in 100)
- RARE: damage to teeth, severe allergy, nerve damage
- VERY RARE: awareness, death (1 in 100,000 ASA 1, 1 in 50,000 for all ASAs)

Specific risks including aspiration, LRTI, post op confusion, covert CVA with possible cognitive changes, temporary memory loss, myocardial infarction also discussed.`,
    'consent-sedation': `Consented for sedation, with risks discussed including death, failure, allergy, awareness, pain and need to progress to GA with its associated risks.`,
    'consent-regional': `Regional risks discussed - superficial skin infection, bleeding, nerve damage (parasthesia and/or paralysis), failure of block, damage to surrounding structures, adverse drug reactions.`,
    'consent-neuraxial': `Discussed risks and benefits of spinal anaesthesia. Specifically, nausea and vomiting, backache, headache, prolonged numbness or tingling, hypotension, urinary retention, nerve injury (1 in 500 temporary, ~1 in 25,000 permanent) and failure of regional technique.`,
    'consent-blood': `Consented to blood products.`,
}

const template = `# BIO
- Name: {{ biography-name }}
- UMRN: {{ biography-umrn }}

# ANTHROPOMETRY
- Age: {{ anthropometry-age }}
- Sex: {{ anthropometry-sex }}
- Height: {{ anthropometry-height }}
- Weight: {{ anthropometry-weight }}
- BMI: {{ anthropometry-bmi }}

# PMHx
{{ history-pmhx }}
 
# SHx
{{ history-socialhx }}
 
# Medications
{{ history-rx }}
 
# Allergies
{{ history-allergies }}
 
# PSHx
{{ history-pshx }}
 
# Anaesthetic Assessment
{{ history-examination }}
 
- STOPBANG: {{ score-stopbang }}/8
- RCRI: {{ score-rcri }}/6
- Apfel: {{ score-apfel }}/4
- SORT: {{ score-sort }}%

# FASTING ADVICE
Fasting from midnight if AM, fasting from early morning, light breakfast if PM list.

# CONSENT
`

function renderTemplate() {
    let output = template
    let tagFinder = /\{\{ ?(.*\b) ?\}\}/gim
    for (let m of output.matchAll(tagFinder)) {
        // find in DOM
        let [stringtoReplace, paasSyncParameter] = m
        let paasSyncTarget = document.querySelector(`[paas-sync-parameter="${paasSyncParameter}"]`)

        // replace (if it exists)
        let paasSyncValue = ''
        if (!paasSyncTarget) {
            console.warn(`TEMPLATE ERROR: no such parameter as "${paasSyncParameter}"`)
        } else {
            paasSyncValue = paasSyncTarget.value || paasSyncTarget.innerText || ''
        }

        output = output.replace(stringtoReplace, paasSyncValue)

    }

    for (let c in consentSnippets) {
        // find out if it's checked
        let relevantCheckbox = document.querySelector(`[paas-sync-parameter="${c}"]`)
        console.log(relevantCheckbox)
        let checked = relevantCheckbox.checked || false
    
        // if checked, append to output
        if (checked == true) {
            output += ( consentSnippets[c] + '\n\n' )
        }
    }
    console.log('wow')
    return output
}

let renderButton = document.querySelector('#render')
let outputArea = document.querySelector('#output')
let dialog = document.querySelector('dialog')
renderButton.addEventListener('click', (e) => {
    outputArea.innerText = renderTemplate()
    dialog.show()
})