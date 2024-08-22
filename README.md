# [Gas Notes: Clinic Helper](https://clinic.gasnotes.net) 😴
This is a little web app to help perioperative doctors get through their clinic days. The key features are:

- **Structured data entry** to make sure you get everything you need
- **Embedded calculators** for a few risk scoring tools
    - Apfel Score
    - RCRI
    - STOP-BANG
    - SORT Score
- **Archiving functionality** to download a nice little markdown summary of your appointment
- **Deep links** to commonly-used clinical applications (UMRN required)

There are also some smarts about piping demographic and anthropometric data into score calculators automatically. Everything is done locally, on-device.

Static HTML and JavaScript is served with [Cloudflare Pages](https://pages.cloudflare.com).

## SORT Score
Many perioperative doctors use the [SORT Score](http://sortsurgery.com) for decision-making about perioperative management. The official site is rather clunky, and its server-side component (on which it is totally dependent) is, as far as I can tell, written in awfully-slow R.

To speed things along, I re-implemented the score to run inside the browser tab (along with a few other conveniences, like alphabetising the options). It's lighting fast now. Many thanks to SORT Score contributor [Dr Danny J. Wong](https://dannyjnwong.github.io/about/) for publishing their original [R implementation](https://github.com/dannyjnwong/SORTWebCalc_dev).

## References
- [Protopapa KL, Simpson JC, Smith NC, Moonesinghe SR. Development and validation of the Surgical Outcome Risk Tool (SORT). Br J Surg. 2014 Dec;101(13):1774-83. doi: 10.1002/bjs.9638. PMID: 25388883; PMCID: PMC4240514.](https://doi.org/10.1002/bjs.9638)

## Open Source
Gas Notes Clinic is released under the [MIT License](LICENSE.txt). This software makes use of these open source projects:

- [Flask](https://flask.palletsprojects.com) (BSD-3-Clause License)
- [SORTWebCalc_dev](https://github.com/dannyjnwong/SORTWebCalc_dev) (MIT License)
- [pyenv](https://github.com/pyenv/pyenv) (MIT License)
- [pipenv](https://github.com/pypa/pipenv) (MIT License)
- [Homebrew](https://github.com/Homebrew/brew) (BSD-2-Clause License)

And these closed-source ones:

- [Monodraw](https://monodraw.helftone.com/) for the ASCII art
- [Flat UI Colors 2](https://flatuicolors.com/)
- [favicon.io](https://favicon.io/) for formatting the favicon