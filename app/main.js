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
umrnInput.addEventListener('input', (e) => {
    let umrnTester = /^[A-Za-z]\d{7}$/
    let valid = umrnTester.test(e.target.value)
    if (valid == true) {
        for (let t in deepLinkTemplates) {
            let targetLink = document.querySelector(`[deeplink="${t}"]`)
            let href = deepLinkTemplates[t].replace('A1234567', e.target.value)
            targetLink.setAttribute('href', href)
        }
    } else {
        let deeplinks = document.querySelectorAll('[deeplink]')
        for (let d of deeplinks) {
            d.setAttribute('disabled', true)
            d.setAttribute('href', '#')
        }
    }
})