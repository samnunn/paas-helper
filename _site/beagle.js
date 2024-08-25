let activeWarnings = new Set()

onmessage = (element) => {
    // handle incoming message
    // console.log(`BGL: Got a new element ${element['value']}`)
    // console.log(element)
    let w = sniff(element.data)

    let warningsToKill = activeWarnings.difference(w)
    if (warningsToKill.size > 0) {
        postMessage({
            type: 'beagle-kill',
            warnings: warningsToKill,
        })
    }

    let warningsToAdd = w.difference(activeWarnings)
    if (warningsToAdd.size > 0) {
        postMessage({
            type: 'beagle-add',
            warnings: warningsToAdd,
        })
    }

    activeWarnings = w
}

let activeWarningsByParameter = {}

let warningStrings = {
    airway: "Possible difficult airway",
    badmouth: "Limited mouth opening",
    anaphylaxis: "Known anaphylaxis",
    abx_allergy: "Antibiotic allergy",
    obesity: "Obesity",
    gord: "GORD",
    osa: "OSA",
    ckd: "Renal impairment",
    smoker: "Active smoker",
    htn: "Hypertension",
    thinners: "Anticoagulated",
    mets: "Less than 4 METs",
    no_fona: "Expected difficult FONA",
    neckrom: "Limited cervical ROM",
    beard: "Bearded",
    too_sweet: "Poor glycaemic control",
    noflat: "Unable to lay flat",
    stopbang_bad: "STOP-BANG ≥ 5",
    ponv: "PONV",
    opioids: "Opioid tolerance",
    sort: "SORT ≥ 0.80",
    ihd: "IHD",
    ccf: "Heart failure",
    insulin: "On insulin",
    flozin: "On SGLT2i",
}

let warningHeuristics = {
    // MEDICAL HISTORY
    'pmhx': [
        (element) => { return element.value.match(/G[OE]RD/i) ? warningStrings['gord'] : null },
        (element) => { return element.value.match(/OSA/i) ? warningStrings['osa'] : null },
        (element) => { return element.value.match(/apnoea/i) ? warningStrings['osa'] : null },
        (element) => { return element.value.match(/htn|hypertension/i) ? warningStrings['htn'] : null },
        (element) => { return element.value.match(/hf|hfref|hfpef|heart failure|ccf|chf/i) ? warningStrings['ccf'] : null },
        (element) => { return element.value.match(/t1dm|iidm/i) ? warningStrings['insulin'] : null },
    ],
    'gord': [
        (element) => { return element.value.match(/yes/i) ? warningStrings['gord'] : null },
    ],
    'uec': [
        (element) => { return element.value.match(/\d{3}/i) ? warningStrings['ckd'] : null },
    ],
    'rx': [
        (element) => { return element.value.match(/prazole/i) ? warningStrings['gord'] : null },
        (element) => { return element.value.match(/pril|sartan|ipine/i) ? warningStrings['htn'] : null },
        (element) => { return element.value.match(/xab|atran|warf|couma|eliq|xera/i) ? warningStrings['thinners'] : null },
        (element) => { return element.value.match(/morph|trama|tapen|lexi|bupr|adone|oxyc/i) ? warningStrings['opioids'] : null },
        (element) => { return element.value.match(/floz|xig|jardia/i) ? warningStrings['flozin'] : null },
    ],
    'smoking': [
        (element) => { return element.value.match(/active/i) ? warningStrings['smoker'] : null },
    ],
    'osmrs-htn': [
        (element) => { return element.value ? warningStrings['htn'] : null },
    ],
    'rcri-ihd': [
        (element) => { return element.value ? warningStrings['ihd'] : null },
    ],
    'rcri-creatinine': [
        (element) => { return element.value ? warningStrings['ckd'] : null },
    ],
    'rcri-ccf': [
        (element) => { return element.value ? warningStrings['ccf'] : null },
    ],
    'rcri-insulin': [
        (element) => { return element.value ? warningStrings['insulin'] : null },
    ],
    // ALLERGIES
    'allergies': [
        (element) => { return element.value.match(/illin|cefa|cepha|mycin|ocin/i) ? warningStrings['abx_allergy'] : null },
    ],
    // AIRWAY
    'mallampati': [
        (element) => { return parseInt(element.value) >= 3 ? warningStrings['airway'] : null },
    ],
    'mouth-opening': [
        (element) => { return parseInt(element.value) <= 3 ? warningStrings['airway'] : null },
    ],
    'tmd': [
        (element) => { return parseInt(element.value) < 6 ? warningStrings['airway'] : null },
    ],
    'cricothyroid': [
        (element) => { return element.value.match(/diff|impalpable/i) ? warningStrings['no_fona'] : null },
    ],
    'jaw-protrusion': [
        (element) => { return element.value.match(/c/i) ? warningStrings['airway'] : null },
    ],
    'neckrom': [
        (element) => { return element.value.match(/moderate|severe|immobile/i) ? warningStrings['neckrom'] : null },
    ],
    'beard': [
        (element) => { return element.value.match(/won't/i) ? warningStrings['beard'] : null },
    ],
    // FITNESS
    'mets': [
        (element) => { return element.value.match(/less/i) ? warningStrings['mets'] : null },
    ],
    'hba1c': [
        (element) => { return parseFloat(element.value) >= 8 ? warningStrings['too_sweet'] : null },
    ],
    'bmi': [
        (element) => { return parseFloat(element.value) >= 30 ? warningStrings['obesity'] : null },
    ],
    'flat': [
        (element) => { return element.value.match(/not/i) ? warningStrings['noflat'] : null },
    ],
    // SCORES
    'stopbang-score': [
        (element) => { return parseFloat(element.value) >= 5 ? warningStrings['stopbang_bad'] : null },
    ],
    'apfel-ponv': [
        (element) => { return element.value ? warningStrings['ponv'] : null },
    ],
    'apfel-score': [
        (element) => { return parseFloat(element.value) >= 3 ? warningStrings['ponv'] : null },
    ],
    'sort-score': [
        (element) => { return parseFloat(element.value) >= 0.80 ? warningStrings['sort'] : null },
    ],
}

function sniff(element) {
    let warnings = new Set()
    let parameter = element['parameter']

    let heuristics = warningHeuristics[parameter]

    if (heuristics) {
        for (let h of heuristics) {
            let result = h(element)
            if (!result) continue
            warnings.add(result)
        }
    }

    activeWarningsByParameter[parameter] = warnings

    return uniteSets(activeWarningsByParameter)
}

function uniteSets(sets) {
    let outputSet = new Set()
    for (let s in sets) {
        outputSet = outputSet.union(sets[s])
    }
    return outputSet
}