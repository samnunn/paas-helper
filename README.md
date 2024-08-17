# [PAAS Helper](https://paas.nunn.io) 🤖
This single-page utility is designed to make life easier in pre-anaesthetic clinic. The key features are:

- **Structured data entry** to make sure you get everything you need
- **Embedded calculators** for a few risk scoring tools
    - Apfel Score
    - RCRI
    - STOP-BANG
    - SORT Score
- **Archiving functionality** to download a nice little markdown summary of your appointment
- **Deep links** to commonly-used clinical applications (UMRN required)

There are also some smarts about piping demographic and athropometric data into score calculators automatically. Everything is done locally, on-device. The static HTML and JavaScript is served with Cloudflare Pages, but there are no true-blue servers to be found.

## SORT Score
My department makes heavy use of the [SORT Score](http://sortsurgery.com) for decision-making about perioperative management. The official site is rather clunky, and its server-side component (on which it is totally dependent) is, as far as I can tell, written in awfully-slow R.

To speed things along, I re-implemented the score to run inside the browser tab (along with a few other conventiences, like alphabetising the options). It's lighting fast now. Many thanks to SORT Score contributor [Dr Danny J. Wong](https://dannyjnwong.github.io/about/) for publishing their original [R implementation](https://github.com/dannyjnwong/SORTWebCalc_dev).

## Experiments with Embeddings
Searching manually by category and then sub-category is a pain and frequently leads to dead ends. In `/api-server` you'll find the remnants of some experiments where I used [embeddings](https://www.cloudflare.com/en-gb/learning/ai/what-are-embeddings/) (weighted according to operation frequency) to pick operations from the list. That necessitated running servers and was proving to be not-all-that-useful, so I scrapped it.

For now.

## References
- [Protopapa KL, Simpson JC, Smith NC, Moonesinghe SR. Development and validation of the Surgical Outcome Risk Tool (SORT). Br J Surg. 2014 Dec;101(13):1774-83. doi: 10.1002/bjs.9638. PMID: 25388883; PMCID: PMC4240514.](https://doi.org/10.1002/bjs.9638)