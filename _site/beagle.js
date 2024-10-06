//    ____                   _                                                     
//   | __ )  ___  __ _  __ _| | ___     ***           ****                         
//   |  _ \ / _ \/ _` |/ _` | |/ _ \   *   ***********    *                        
//   | |_) |  __/ (_| | (_| | |  __/   ***               *                         
//   |____/ \___|\__,_|\__, |_|\___|  *    ***********    *                        
//                     |___/           ****           ****                         

let staleBones = {}

onmessage = (m) => {
    // console.info(`beagle-message-received`, m)
    let newBones = getBones(m.data.inputData)

    // update bones
    let newBoneNames = new Set(Object.keys(newBones))
    let staleBoneNames = new Set(Object.keys(staleBones))
    let bonesToAdd = newBoneNames.difference(staleBoneNames)
    let bonesToDelete = staleBoneNames.difference(newBoneNames)

    for (let b of bonesToAdd) {
        postMessage({
            type: 'beagle-bone-add',
            name: newBones[b].name,
            severity: newBones[b].severity,
            citation: newBones[b].citation,
        })
    }
    for (let b of bonesToDelete) {
        postMessage({
            type: 'beagle-bone-delete',
            name: staleBones[b].name,
        })
    }

    // update suggestions
    for (let nb_key in newBones) {
        let nb = newBones[nb_key]

        let staleSuggestions = staleBones[nb_key]?.suggestions || new Set()

        let suggestionsToDelete = staleSuggestions.difference(nb?.suggestions)
        let suggestionsToAdd = nb?.suggestions?.difference(staleSuggestions)

        for (let s of suggestionsToAdd) {
            postMessage({
                type: 'beagle-suggestion-add',
                bone: nb.name,
                suggestion: s,
            })
        }

        for (let s of suggestionsToDelete) {
            postMessage({
                type: 'beagle-suggestion-delete',
                bone: nb.name,
                suggestion: s,
            })
        }
    }

    // save state
    staleBones = newBones
}

// takes data, returns bones
function getBones(inputData) {
    let newBones = {}
    for (b of bones) {
        let boneDoesMatch = b.test(inputData)
        if (boneDoesMatch == true) {
            let conditionalSuggestions = b.getConditionalSuggestions(inputData)
            let allSuggestions = b.defaultSuggestions.concat(conditionalSuggestions)
            let foundBone = {
                name: b.name,
                citation: b.citation,
                severity: b.getSeverity(inputData) || 'default',
                suggestions: new Set(allSuggestions),
            }
            newBones[b.name] = foundBone
        }
    }
    return newBones
}

function runRule(rule, inputData) {
    try {
        if (rule(inputData) == true) return true
    } catch {
        return false
    }
    return false
}

class Bone {
    constructor(name, citation, matchStrategy, matchRules, defaultSuggestions, conditionalSuggestions, severityGrades) {
        this.name = name
        this.citation = citation
        this.matchStrategy = matchStrategy
        this.matchRules = matchRules
        this.defaultSuggestions = defaultSuggestions
        this.conditionalSuggestions = conditionalSuggestions
        this.severityGrades = severityGrades
    }
    
    test(inputData) {
        if (this.matchStrategy == "all") {
            if (this.matchRules.every( (r) => runRule(r, inputData) )) return true
        } else {
            if (this.matchRules.some( (r) => runRule(r, inputData) )) return true
        }
        return false
    }

    getSeverity(inputData) {
        if (!this.severityGrades) return null
        
        for (let severityGrade of this.severityGrades) {
            if (severityGrade?.matchStrategy == "all") {
                if (severityGrade.matchRules.every( (r) => runRule(r, inputData) )) return severityGrade.name
            } else {
                if (severityGrade.matchRules.some( (r) => runRule(r, inputData) )) return severityGrade.name
            }
        }
        return null
    }
    
    getConditionalSuggestions(inputData) {
        let conditionalSuggestions = []
        for (let conditionalGroup of this.conditionalSuggestions) {
            if (conditionalGroup?.matchStrategy == "all") {
                if (conditionalGroup.matchRules.every( (r) => runRule(r, inputData) )) {
                    conditionalSuggestions = conditionalSuggestions.concat(conditionalGroup.suggestions)
                }
            } else {
                if (conditionalGroup.matchRules.some( (r) => runRule(r, inputData) )) {
                    conditionalSuggestions = conditionalSuggestions.concat(conditionalGroup.suggestions)
                }
            }
        }
        return conditionalSuggestions
    }
}

let boneData = [
    {
        name: "anonymous",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => true,
        ],
        defaultSuggestions: [
            // "foobar",
        ],
        conditionalSuggestions: [
            {
                matchStrategy: "any",
                matchRules: [
                    (inputData) => parseFloat(inputData['sort-score']) > 1.5,
                ],
                suggestions: [
                    "Admit to HDU/ICU bed",
                ],
            },
            {
                matchStrategy: "any",
                matchRules: [
                    (inputData) => {
                        let sort = parseFloat(inputData['sort-score'])
                        if (0.80 <= sort && sort <= 1.5) return true
                    },
                ],
                suggestions: [
                    "Admit to monitored bed",
                ],
            },
        ],
        severityGrades: [
        ],
    },
    {
        name: "PONV",
        citation: "https://www.ashp.org/-/media/assets/policy-guidelines/docs/endorsed-documents/endorsed-documents-fourth-consensus-guidelines-postop-nausea-vomiting.pdf",
        matchStrategy: "any",
        matchRules: [
            (inputData) => parseInt(inputData['apfel-score']) > 0,
        ],
        defaultSuggestions: [
            "Minimise use of nitrous oxide, volatile anaesthetics, and high-dose neostigmine",
            "Utilise regional anaesthesia if possible",
            "Maximise opioid-sparing analgesia",
        ],
        conditionalSuggestions: [
            {
                matchStrategy: "any",
                matchRules: [
                    (inputData) => [1,2].includes(parseInt(inputData['apfel-score'])),
                ],
                suggestions: [
                    "Give two anti-emetics",
                ],
            },
            {
                matchStrategy: "any",
                matchRules: [
                    (inputData) => [3,4].includes(parseInt(inputData['apfel-score'])),
                ],
                suggestions: [
                    "Give 3-4 anti-emetics",
                ],
            },
        ],
        // 0 1 low
        // 2 medium
        // 3 high
        severityGrades: [
            {
                name: "high risk",
                matchStrategy: "any",
                matchRules: [
                    (inputData) => [3,4].includes(parseInt(inputData['apfel-score'])),
                ],
            },
            {
                name: "medium risk",
                matchStrategy: "any",
                matchRules: [
                    (inputData) => [2].includes(parseInt(inputData['apfel-score'])),
                ],
            },
            {
                name: "low risk",
                matchStrategy: "any",
                matchRules: [
                    (inputData) => [0,1].includes(parseInt(inputData['apfel-score'])),
                ],
            },
        ],
    },
    {
        name: "Diabetes",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /t1dm|t2dm|iddm|diabet/i.test(inputData['pmhx']),
            (inputData) => /sulin|metf|iclaz|glipin|glargine|janu|floz|xig|jardia/i.test(inputData['rx']),
            (inputData) => inputData['rcri-insulin'] == true,
        ],
        defaultSuggestions: [
            // "Default suggestion for diabetic patients",
            "BSL on arrival",
        ],
        conditionalSuggestions: [
            {
                matchStrategy: "any",
                matchRules: [
                    (inputData) => parseFloat(inputData['hba1c']) >= 9.1,
                ],
                suggestions: [
                    "Endocrinology referral for pre-operative optimisation",
                ],
            },
        ],
        severityGrades: [
        ],
    },
    {
        name: "SGTL2i in use",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /floz|xig|jard/i.test(inputData['rx']),
        ],
        defaultSuggestions: [
            // "Default suggestion for patients on SGLT2i",
        ],
        conditionalSuggestions: [
        ],
    },
    {
        name: "Potentially challenging airway",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => parseInt(inputData['mallampati']) >= 3,
            (inputData) => parseInt(inputData['mouth-opening']) <= 3,
            (inputData) => parseInt(inputData['tmd']) <= 6,
            (inputData) => inputData['jaw-protrusion'].toLowerCase() == "c",
            (inputData) => /diff|2|two|gued|opa|npa|naso|oro|fail/i.test(inputData['bvm']),
            (inputData) => /diff|seal|poor|fail/i.test(inputData['lma']),
            (inputData) => /diff|3|4|AFO|CICO|FONA|fail/i.test(inputData['ett']),
            (inputData) => /moderate|severe|immobile/i.test(inputData['neckrom']),
            (inputData) => /won/i.test(inputData['beard']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Possible difficult FONA",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /diff|impalpable/i.test(inputData['cricothyroid']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
    },
    {
        name: "Known analphylaxis",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /anaph|(?<!pro.+)ylaxis|(?<!pro.+)ylact/i.test([inputData['pmhx'], inputData['rx'], inputData['allergies']].join(' ')),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Antibiotic allergy",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /cilli|illin|cefa|cepha|mycin|ocin/i.test(inputData['allergies']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Obesity",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => parseFloat(inputData['bmi']) >= 30,
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "GORD",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /G[OE]RD/i.test(inputData['pmhx']),
            (inputData) => /yes/i.test(inputData['gord']),
            (inputData) => /prazol|somac|nexim|pariet|esopre/i.test(inputData['rx']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "OSA",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /OSA|apnoea/i.test(inputData['pmhx']),
            (inputData) => parseInt(inputData['stopbang-score']) >= 5,
            (inputData) => {
                let stopCriteria = [inputData['snorer'], inputData['daytime-tiredness'], inputData['observed-apnoea'], inputData['hypertensive']]
                let highRiskCriteria = [inputData['stopbang-bmi-35'], inputData['stopbang-neck'], inputData['stopbang-sex']] // BANG criteria minus age
                stopCriteria = stopCriteria.filter((v) => v == true)
                highRiskCriteria = highRiskCriteria.filter((v) => v == true)

                if (stopCriteria.length >= 2 && highRiskCriteria.length >= 1) return true
                
                return false
            },
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Abnormal renal function",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /\d{3}/i.test(inputData['uec']),
            (inputData) => inputData['rcri-creatinine'] == true,
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Active smoker",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /active/i.test(inputData['smoking']),
        ],
        defaultSuggestions: [
            "Advise to cease smoking before surgery",
            "Referral for assistance with smoking cessation",
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Anticoagulated",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /xab|atran|warf|couma|eliq|xera|pradax/i.test(inputData['rx']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Poor cardiorespiratory fitness",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /less/i.test(inputData['mets']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Unable to lay flat",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /not/i.test(inputData['flat']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Opioid tolerance",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /morph|trama|tapen|lexi|bupr|adone|targin|oxyc/i.test(inputData['rx']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Ischaemic heart disease",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => inputData['rcri-ihd'] == true,
            (inputData) => /IHD|STEMI|heart attack/i.test(inputData['pmhx']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Heart failure",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /hf|hfref|hfpef|heart failure|ccf|chf/i.test(inputData['pmhx']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
    {
        name: "Recent illness",
        citation: "",
        matchStrategy: "any",
        matchRules: [
            (inputData) => /y/i.test(inputData['recently-ill']),
        ],
        defaultSuggestions: [
        ],
        conditionalSuggestions: [
        ],
        severityGrades: [
        ],
    },
]

let bones = []
for (b of boneData) {
    bones.push(new Bone(b.name, b.citation, b.matchStrategy, b.matchRules, b.defaultSuggestions, b.conditionalSuggestions, b.severityGrades))
}