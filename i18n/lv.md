# Huecut in Latvian

Every text the app shows, one row each. Fill only the Latvian column; keep the id, English, source and notes as they are.

- Keep every `{placeholder}` exactly as it is: the app puts a name or a number there.
- `\|` is a | in the text and `\n` a new line: keep both written that way.
- `plural zero`, `plural one`, `plural other` in the notes: the Latvian form for those numbers, each with its `{placeholder}`.
- `safety`: shown in English in the app until its Latvian passes the back-translation check and `checked` is in the notes. Importing a changed Latvian text for it clears `checked`.
- `same`: the Latvian may be the same as the English.
- `was:` the Latvian before the English changed: translate the new English.

Then `npm run i18n:import` checks the file and builds the app's Latvian.

## Strings

| id | English | Latvian | source | notes |
| --- | --- | --- | --- | --- |
| app.name | Huecut | Huecut | 7c2e4547 | same |
| app.homeLink | Huecut, home | Huecut, sākums | 5197ba7b |  |
| app.skipToContent | Skip to content | Pāriet uz saturu | ac576a66 |  |
| app.opening.explore | Opening Explore | Atver sadaļu «Pārlūkot» | 827acb0a |  |
| app.opening.saved | Opening Saved | Atver sadaļu «Saglabātie» | 326c7b32 |  |
| app.opening.help | Opening Help | Atver sadaļu «Palīdzība» | c987ab9e |  |
| nav.label | Main | Galvenā | eb814be3 |  |
| nav.explore | Explore | Pārlūkot | 3b73900b |  |
| nav.myLook | My look | Mans tēls | b05ff74f |  |
| nav.saved | Saved | Saglabātie | b5c120b3 |  |
| nav.help | Help | Palīdzība | b79cac92 |  |
| nav.settings | Settings | Iestatījumi | 74a883a0 |  |
| sheet.close | Close | Aizvērt | 7d9eb7ac |  |
| sheet.expand | Expand | Izvērst | 07548c2c |  |
| sheet.collapse | Collapse | Sakļaut | be6eb1fc |  |
| settings.title | Settings | Iestatījumi | 74a883a0 |  |
| settings.theme | Theme | Noformējums | efb52e71 |  |
| settings.themes.system | System | Sistēmas | 6725e7bb |  |
| settings.themes.light | Light | Gaišais | dbcd5e7b |  |
| settings.themes.dark | Dark | Tumšais | 60acc53f |  |
| settings.motion | Motion | Kustība | 8ca34424 |  |
| settings.motionHint | Reduce turns off movement in the app, even when your device allows it. | Iestatījums «Samazināt» izslēdz kustības lietotnē, pat ja ierīcē tās ir atļautas. | a9f89b85 |  |
| settings.motions.device | Follow my device | Pielāgot ierīcei | 242f93cd |  |
| settings.motions.reduce | Reduce | Samazināt | 42412678 |  |
| home.promiseLines.0 | Find a cut and colour | Atrodi griezumu un krāsu, | ba44be53 |  |
| home.promiseLines.1 | that suit your hair, | kas der taviem matiem, | f9dee917 |  |
| home.promiseLines.2 | and know why. | un uzzini, kāpēc. | 6a9a93c8 |  |
| home.subline | Advice from your photo and your answers. Free. The app never uploads your photos. | Ieteikumi pēc tava foto un atbildēm. Bez maksas. Lietotne nekad neaugšupielādē tavas fotogrāfijas. | 79b4f692 |  |
| home.expectations | Pictures of you with each look are made in your own ChatGPT or Gemini. The app writes the prompts and lines up the results. | Tavas bildes ar katru tēlu top tavā ChatGPT vai Gemini. Lietotne sagatavo vaicājumus un sakārto rezultātus. | 60dc6132 |  |
| home.findMyLook | Find my look | Atrast savu tēlu | dfee3056 |  |
| home.continueLook | Continue where you left off | Turpināt no vietas, kur paliki | dfbc51e0 |  |
| home.startAgain.action | Start again | Sākt no jauna | 962e64b7 |  |
| home.startAgain.title | Start again? | Sākt no jauna? | 6e96a83b |  |
| home.startAgain.body | This replaces the session saved on this device. The saved one stays until your first new answer or photo is saved. | Tas aizstās šajā ierīcē saglabāto sesiju. Iepriekšējā paliks neskarta, līdz saglabāsi pirmo jauno atbildi vai fotogrāfiju. | a5af5f53 |  |
| home.startAgain.yes | Yes, start again | Jā, sākt no jauna | 73820c75 |  |
| home.startAgain.no | Keep my session | Paturēt esošo sesiju | b33cf017 |  |
| home.explore | Explore styles and colours | Pārlūkot griezumus un krāsas | 3440f7b3 |  |
| home.scrollCue | Scroll | Ritini | 291873e3 |  |
| home.example | See an example first | Vispirms apskatīt piemēru | cfdf25e6 |  |
| home.answersOnly | No photo? Get ideas from answers only | Nav foto? Iegūsti idejas tikai pēc atbildēm | e969e84b |  |
| home.wallTitle | More than 200 cuts and about 70 colour looks, for women and men. | Vairāk nekā 200 griezumu un ap 70 krāsu tēlu sievietēm un vīriešiem. | a18538d9 |  |
| home.looks.frenchBob | French bob | Franču bobs | 32c47741 |  |
| home.looks.auburnMoneyPiece | Auburn money piece | Kastaņbrūns money piece | e341cd5f |  |
| home.looks.modernPompadour | Modern pompadour | Modernais pompadūrs | 23c1b0f7 |  |
| home.looks.silverGloss | Silver gloss | Sudraba gloss | b7561c1e |  |
| home.looks.italianBob | Italian bob | Itāļu bobs | fe579213 |  |
| home.looks.afroBlowout | Afro blowout | Afro blowout | e46f6e24 | same |
| home.looks.curlyBobFringe | Curly bob with fringe | Cirtains bobs ar priekšmatiem | ae8dec43 |  |
| home.looks.classicScissorTaper | Classic scissor taper | Klasiskais šķēru taper | 5940a449 |  |
| home.looks.wolfCut | Wolf cut | Wolf cut | 446c72cd | same |
| home.looks.burstFade | Burst fade | Burst fade | 54393c40 | same |
| home.looks.curtainFringeLob | Lob with a curtain fringe | Lobs ar aizkaru priekšmatiem | fc16f158 |  |
| home.looks.charcoalGrey | Charcoal grey | Ogļu pelēks | 67018e69 |  |
| home.looks.greyBlendBlonde | Grey blending with blonde | Sirmo matu iepludināšana ar blondo toni | 9ae234eb |  |
| home.looks.modernPompadourFade | Modern pompadour with fade | Modernais pompadūrs ar fade | 6c022aa9 |  |
| home.looks.longButterfly | Long butterfly cut | Garais butterfly griezums | b68e3e36 |  |
| home.looks.classicPixie | Classic pixie | Klasiskais pixie | ff1e11d5 |  |
| home.lines.title | It starts with the lines of your face. | Viss sākas ar tavas sejas līnijām. | 1fbc2200 |  |
| home.lines.points.0 | Hairline, brows, jaw: drawn on your own photo, on your own device. | Matu augšanas līnija, uzacis, žokļa līnija: iezīmētas tavā fotogrāfijā, tavā ierīcē. | 777c3583 |  |
| home.lines.points.1 | No scores. Just what a stylist would look at. | Nekādu vērtējumu. Tikai tas, kam uzmanību pievērstu stilists. | 51bc535d |  |
| home.lines.points.2 | Then cuts and colours picked for your hair, each with its reasons. | Pēc tam — tieši taviem matiem piemeklēti griezumi un krāsas, katrs ar savu pamatojumu. | 08f41191 |  |
| home.colour.title | Every colour gets an honest answer. | Godīga atbilde par katru matu krāsu. | f274b75d |  |
| home.colour.body | Each colour idea says how likely it is for your hair, why, and what to ask your colourist. | Pie katras krāsu idejas uzzināsi, cik tā ir reāla taviem matiem, kāpēc tā ir un ko pajautāt savam koloristam. | 5fcdf80d |  |
| home.colour.examples.0.name | Golden blonde | Zeltainais blonds | d0813d92 |  |
| home.colour.examples.0.label | Plausible | Reālistiski | 1b0e4aaa | safety; checked |
| home.colour.examples.0.why | Up to two levels lighter, on healthy hair that has not been coloured. | Līdz diviem toņiem gaišāks uz veselīgiem, nekrāsotiem matiem. | 6258999d |  |
| home.colour.examples.1.name | Plum violet | Plūmju violetais | fe78e7d3 |  |
| home.colour.examples.1.label | Best done by a colourist | Vislabāk uzticēt koloristam | 416f2703 | safety; checked |
| home.colour.examples.1.why | Hair this dark has to be lightened first for a violet to show. | Tik tumši mati vispirms ir jāpadara gaišāki, lai violetais tonis vispār būtu redzams. | 543ae180 |  |
| home.colour.examples.2.name | Mahogany | Mahagons | c678b4d8 |  |
| home.colour.examples.2.label | Plausible | Reālistiski | 1b0e4aaa | safety; checked |
| home.colour.examples.2.why | Close to the depth you have now, so it needs no lightening. | Tas ir tuvu tavam pašreizējam toņa dziļumam, tāpēc mati nav jāpadara gaišāki. | 5d92c0aa |  |
| home.colour.examples.3.name | Beige blonde | Bēšais blonds | d6f6980d |  |
| home.colour.examples.3.label | Uncertain | Nav pārliecības | 4e313210 | safety; checked |
| home.colour.examples.3.why | Three or four levels lighter, so it depends on your hair's history. | Trīs vai četrus toņus gaišāks, tāpēc tas ir atkarīgs no tavu matu vēstures. | c58f8381 |  |
| home.closing.title | Then see it on you. | Pēc tam ieraugi, kā tas izskatās tev. | 1148183f |  |
| home.closing.body | Copy a prompt into your own ChatGPT or Gemini, and put the results side by side. | Nokopē vaicājumu savā ChatGPT vai Gemini un salīdzini rezultātus blakus. | 38413b98 |  |
| home.privacy | The app never uploads your photos. It hands a copy only to the app you choose when you tap Share or Download. | Lietotne nekad neaugšupielādē tavas fotogrāfijas. Tā nodod kopiju vienīgi tavai izvēlētajai lietotnei, kad pieskaries «Kopīgot» vai «Lejupielādēt». | a532ada9 |  |
| home.trademark | ChatGPT is a trademark of OpenAI and Gemini a trademark of Google; Huecut is not affiliated with either. | ChatGPT ir OpenAI preču zīme, un Gemini ir Google preču zīme; Huecut nav saistīts ne ar vienu no tām. | d8fb1d4c |  |
| inAppBrowser.message | This page is open inside another app. Photos, saving and sharing work better in Safari or Chrome. | Šī lapa ir atvērta citā lietotnē. Fotogrāfijas, saglabāšana un kopīgošana labāk darbojas pārlūkā Safari vai Chrome. | 11f4caa5 |  |
| inAppBrowser.copyLink | Copy link | Kopēt saiti | dbf362d4 |  |
| inAppBrowser.linkCopied | Link copied | Saite nokopēta | d12860c2 |  |
| inAppBrowser.copyFailed | This app does not allow copying. Press and hold the link to copy it: | Šī lietotne neļauj kopēt. Nospied un paturi saiti, lai to nokopētu: | 01dddb6c |  |
| inAppBrowser.howToOpen | How to open it | Kā to atvērt | 36ba0121 |  |
| inAppBrowser.howToOpenSteps | Tap this app's menu (often three dots or a share icon). Then choose Open in browser, Open in Safari or Open in Chrome. | Pieskaries šīs lietotnes izvēlnei (bieži tie ir trīs punktiņi vai kopīgošanas ikona). Pēc tam izvēlies «Atvērt pārlūkā», «Atvērt Safari» vai «Atvērt Chrome». | 358c3b0b |  |
| error.title | This screen could not be shown | Šo ekrānu neizdevās parādīt | 96f6719c |  |
| error.body | Part of the app stopped unexpectedly. Reloading the page usually brings it back. | Kāda lietotnes daļa negaidīti pārstāja darboties. Lapas pārlādēšana parasti palīdz. | 72a1ac1d |  |
| error.action | Reload the page | Pārlādēt lapu | fdb61557 |  |
| error.code | Error code: screen_failed | Kļūdas kods: screen_failed | 666d21b1 |  |
| notFound.title | There is no page at this address | Šajā adresē nav lapas | ade93db7 |  |
| notFound.body | The link may be out of date. | Iespējams, saite ir novecojusi. | 3de61c17 |  |
| notFound.action | Go to Home | Uz sākumu | 746c8138 |  |
| explore.title | Explore styles and colours | Pārlūkot griezumus un krāsas | 3440f7b3 |  |
| explore.illustrations | The models in these pictures are fictional. The pictures are made as illustrations. | Attēlos redzamie modeļi ir izdomāti. Attēli ir veidoti kā ilustrācijas. | 996b987a |  |
| explore.tabsLabel | What to explore | Ko vēlies apskatīt | 25dbbc04 |  |
| explore.tabs.styles | Styles | Griezumi | 3626e7fd |  |
| explore.tabs.colours | Colours | Krāsas | 88f20221 |  |
| explore.tabs.beards | Beards | Bārdas | 4a8a7a45 |  |
| explore.showLegend | Show | Rādīt | 0df6f1ca |  |
| explore.shows.salon | Women's styles | Sieviešu griezumi | 14a1a295 |  |
| explore.shows.barbering | Men's styles | Vīriešu griezumi | 4a12f551 |  |
| explore.shows.all | All | Visi | a52ace42 |  |
| explore.filters | Filters | Filtri | 546ebb8e |  |
| explore.quickFilters | Quick filters | Ātrie filtri | e01c5f27 |  |
| explore.allFilters | All filters | Visi filtri | 3deeda2a |  |
| explore.clearFilters | Clear filters | Noņemt filtrus | 7179ea00 |  |
| explore.searchLabel | Search by name | Meklēt pēc nosaukuma | 4ae2b333 |  |
| explore.clearSearch | Clear search | Notīrīt meklēto | 3b7ea517 |  |
| explore.groups.styles.length | Length | Garums | adc95605 |  |
| explore.groups.styles.texture | Texture | Tekstūra | e28411a3 |  |
| explore.groups.styles.fringe | Fringe | Priekšmati | 7684d4b1 |  |
| explore.groups.styles.upkeep | Upkeep | Uzturēšana | 7671224c |  |
| explore.groups.styles.works | Works with | Piemērots | 48f187a7 |  |
| explore.groups.colours.family | Colour family | Krāsu gamma | 7506113e |  |
| explore.groups.colours.technique | Technique | Tehnika | bf4043a9 |  |
| explore.groups.colours.upkeep | Upkeep | Uzturēšana | 7671224c |  |
| explore.groups.beards.length | Length | Garums | adc95605 |  |
| explore.groups.beards.shape | Shape | Forma | e0e49270 |  |
| explore.options.length.short | Short | Īsi | f5d61ead |  |
| explore.options.length.medium | Medium length | Pusgari | 6caf8772 |  |
| explore.options.length.long | Long | Gari | d1d87c47 |  |
| explore.options.texture.straight | Straight | Taisni | dc81306b |  |
| explore.options.texture.wavy | Wavy | Viļņaini | 0d99011d |  |
| explore.options.texture.curly | Curly | Cirtaini | 71142c83 |  |
| explore.options.texture.coily | Coily | Sīki cirtaini | d73b49a2 |  |
| explore.options.fringe.fringe | With a fringe | Ar priekšmatiem | 1e487531 |  |
| explore.options.fringe.none | No fringe | Bez priekšmatiem | 5167f29b |  |
| explore.options.upkeep.low | Low upkeep | Viegli uzturēt | 95497ef3 |  |
| explore.options.works.hairline | Works with a hairline higher at the temples | Piemērots augstākai matu līnijai pie deniņiem | 1c7db06c |  |
| explore.options.works.fine | Works with fine hair | Piemērots smalkiem matiem | c33a3193 |  |
| explore.options.family.blonde | Blonde | Blondie toņi | 4495c74f |  |
| explore.options.family.brunette | Brunette | Brūnie toņi | f08ad7a3 |  |
| explore.options.family.red_copper | Red and copper | Rudie un vara toņi | 2008965e |  |
| explore.options.family.black | Black | Melnie toņi | c6cfe6e4 |  |
| explore.options.family.grey_silver | Grey and silver | Pelēkie un sudraba toņi | 52c881ca |  |
| explore.options.family.vivid | Vivid | Košie toņi | acbbdc93 |  |
| explore.options.beardLength.none | No beard | Bez bārdas | 8b9b7f0b |  |
| explore.options.beardLength.stubble | Stubble | Rugāji | 3e53231b |  |
| explore.options.beardLength.short | Short | Īsa | f5d61ead |  |
| explore.options.beardLength.medium | Medium length | Vidēja garuma | 6caf8772 |  |
| explore.options.beardLength.long | Long | Gara | d1d87c47 |  |
| explore.options.shape.none | No beard | Bez bārdas | 8b9b7f0b |  |
| explore.options.shape.fuller_sides | Fuller at the sides | Biezāka sānos | 8c1020a7 |  |
| explore.options.shape.short_sides | Short at the sides | Īsāka sānos | 4152cb38 |  |
| explore.options.shape.short_along_jaw | Short along the jaw | Īsa gar žokļa līniju | 94a59215 |  |
| explore.options.shape.full_rounded | Full and rounded | Kupla un noapaļota | ace92179 |  |
| explore.options.shape.fuller_chin | Fuller at the chin | Biezāka pie zoda | 9a8e815a |  |
| explore.options.shape.pointed_chin | Pointed at the chin | Smaila pie zoda | f7aba333 |  |
| explore.options.shape.ducktail | Ducktail | Ducktail | 0c765cac | same |
| explore.options.shape.goatee | Goatee | Kazbārdiņa | 3f53cf8a |  |
| explore.options.shape.chin_strap | Chin strap | Chin strap | d0062905 | same |
| explore.options.shape.moustache_only | Moustache only | Tikai ūsas | 3a8e7a53 |  |
| explore.what.styles | styles | griezumi | 90a7578c |  |
| explore.what.colours | colour looks | krāsojumi | 85cbede9 |  |
| explore.what.beards | beards | bārdas | 7eb7a65f |  |
| explore.loading | Loading the library | Ielādē katalogu | b4655363 |  |
| explore.empty.styles | There are no styles in the library yet. | Katalogā vēl nav neviena griezuma. | 087929c4 |  |
| explore.empty.colours | There are no colour looks in the library yet. | Katalogā vēl nav neviena krāsojuma. | 2e1a1c79 |  |
| explore.empty.beards | There are no beards in the library yet. | Katalogā vēl nav nevienas bārdas. | b2175877 |  |
| explore.caption.anyTexture | any texture | jebkura tekstūra | d7537387 |  |
| explore.caption.textures.straight | straight | taisni | 2a424875 |  |
| explore.caption.textures.wavy | wavy | viļņaini | 398a882c |  |
| explore.caption.textures.curly | curly | cirtaini | 6307fe49 |  |
| explore.caption.textures.coily | coily | sīki cirtaini | d3210caa |  |
| explore.caption.beardShape.none | no beard | bez bārdas | aede8ec2 |  |
| explore.caption.beardShape.fuller_sides | fuller at the sides | biezāka sānos | ac566292 |  |
| explore.caption.beardShape.short_sides | short at the sides | īsāka sānos | a1f71b89 |  |
| explore.caption.beardShape.short_along_jaw | kept along the jaw | veidota gar žokļa līniju | 42e3b6a3 |  |
| explore.caption.beardShape.full_rounded | full and rounded | kupla un noapaļota | 6491833f |  |
| explore.caption.beardShape.fuller_chin | fuller at the chin | biezāka pie zoda | 6daa8db8 |  |
| explore.caption.beardShape.pointed_chin | pointed at the chin | smaila pie zoda | 29cc8781 |  |
| explore.caption.beardShape.ducktail | a ducktail | «ducktail» forma | c86b91bd |  |
| explore.caption.beardShape.goatee | a goatee | kazbārdiņa | dca23d42 |  |
| explore.caption.beardShape.chin_strap | a chin strap | «chin strap» stils | f13d9239 |  |
| explore.caption.beardShape.moustache_only | moustache only | tikai ūsas | 702db8b1 |  |
| explore.views.front | Front view | Skats no priekšas | e119acb0 |  |
| explore.views.side | Side view | Skats no sāniem | cb6def83 |  |
| explore.views.back | Back view | Skats no aizmugures | d7f485e1 |  |
| explore.models.straight_wavy | straight-to-wavy | taisni līdz viļņaini | c22db0a9 |  |
| explore.models.curly_coily | curly-to-coily | cirtaini līdz sīki cirtaini | 1ff6c1c7 |  |
| explore.detail.loading | Loading the details | Ielādē aprakstu | b632161e |  |
| explore.detail.picturesLabel | Pictures | Attēli | 1e624500 |  |
| explore.detail.previous | Previous | Iepriekšējais | a57b08a4 |  |
| explore.detail.next | Next | Nākamais | 1ff57a29 |  |
| explore.detail.lengths | Lengths | Garumi | 61af5be9 |  |
| explore.detail.fade | Fade | Fade | 9efb597c | same |
| explore.detail.upkeep | Upkeep | Uzturēšana | 7671224c |  |
| explore.detail.colour | Colour | Matu krāsa | 3a9dfa58 |  |
| explore.detail.worksIf | Works with your hair if… | Piemērots taviem matiem, ja… | 46e624d9 |  |
| explore.detail.worksIfBeard | Works with your beard if… | Piemērots tavai bārdai, ja… | c7f713f8 |  |
| explore.detail.works.hairline | your hairline is higher at the temples | tava matu līnija ir augstāka pie deniņiem | 26377662 |  |
| explore.detail.works.fine | it is fine | mati ir smalki | 6f07f3b9 |  |
| explore.detail.works.thick | it is thick | mati ir biezi | d18e784a |  |
| explore.detail.works.crown | it is thinner at the crown | mati ir plānāki galvvidū | aaddb0ba |  |
| explore.detail.densities.low | low | zems | 6c1ff09d |  |
| explore.detail.densities.medium | medium | vidējs | c082456a |  |
| explore.detail.densities.high | high | augsts | 6ef7c9b1 |  |
| explore.detail.beardZones.cheeks | Cheeks | Vaigi | e817313e |  |
| explore.detail.beardZones.chin | Chin | Zods | 0f9aa8a1 |  |
| explore.detail.beardZones.moustache | Moustache | Ūsas | 138fa83d |  |
| explore.detail.beardZones.neck | Neck | Kakls | 6b27a971 |  |
| explore.detail.beardZones.sideburns | Sideburns | Bakbārdas | 21d75ff6 |  |
| explore.detail.cheekLine | Cheek line | Vaigu līnija | 06ff929c |  |
| explore.detail.neckline | Neckline | Kakla līnija | 2ffc239c |  |
| explore.detail.cheekLines.natural | Natural | Dabiska | d6acb6d5 |  |
| explore.detail.cheekLines.low | Low | Zema | f793de20 |  |
| explore.detail.cheekLines.sharp | Sharp | Izteikta | 1a3c4b30 |  |
| explore.detail.necklines.natural | Natural | Dabiska | d6acb6d5 |  |
| explore.detail.necklines.two_fingers | Two fingers above the throat | Divi pirksti virs ādamābola | ad3d7afa |  |
| explore.detail.necklines.high | High | Augsta | c4ebc6d4 |  |
| explore.detail.trim | Trim | Pielīdzināšana | aaa5478b |  |
| explore.detail.daily | Daily | Ikdienā | b36c2611 |  |
| explore.detail.products | Products | Līdzekļi | 4edc8bfa |  |
| explore.detail.pairs.beards | Beards that go with it | Bārdas, kas piestāv | 1c43017d |  |
| explore.detail.pairs.cuts | Cuts that go with it | Griezumi, kas piestāv | 9b116cc5 |  |
| explore.detail.copyPrompt | Copy prompt | Kopēt uzvedni | ffc64b8b |  |
| explore.detail.promptCopied | Prompt copied | Uzvedne nokopēta | c5539477 |  |
| explore.detail.promptCopiedLive | Prompt copied. Now open ChatGPT or Gemini and paste it. | Uzvedne nokopēta. Tagad atver ChatGPT vai Gemini un ielīmē to. | c4c66d52 |  |
| explore.detail.promptSteps | Paste it into a normal AI chat with your photo. The picture you get back is yours to save here. | Ielīmē to parastā mākslīgā intelekta čatā kopā ar savu foto. Iegūto attēlu vari saglabāt šeit. | b48bab20 |  |
| explore.detail.promptPreparing | Getting the prompt ready | Sagatavo uzvedni | f496c7dc |  |
| explore.detail.showPrompt | Show the prompt | Rādīt uzvedni | 36cb209a |  |
| explore.detail.promptLabel | The prompt | Uzvedne | b62c640b |  |
| explore.detail.copyRefused | This browser did not allow copying. The prompt is selected in the box below: copy it from there. | Šī pārlūkprogramma neļāva nokopēt. Uzvedne ir iezīmēta lodziņā zemāk — nokopē to no turienes. | 588d7be7 |  |
| explore.detail.promptFailed | The prompt for this look could not be made from the library. | Šim tēlam neizdevās izveidot uzvedni no kataloga. | 966e4ec2 |  |
| explore.detail.showStylist | Show your stylist | Parādīt stilistam | 30f641ad |  |
| explore.detail.save | Save | Saglabāt | 1509f561 |  |
| explore.detail.findMyLook | Find my look with this style | Atrast savu tēlu ar šo griezumu | 278ba053 |  |
| explore.detail.adding | Adding it to My look | Pievieno sadaļai «Mans tēls» | d23f26d0 |  |
| explore.detail.listFull | Your list holds 8 ideas, the most it can. Remove one to add this. | Tavā sarakstā ir 8 idejas — tas ir maksimālais skaits. Noņem kādu, lai pievienotu šo. | ce4664ba |  |
| explore.detail.addFailed | My look could not open. Reload the page to try again. | Neizdevās atvērt sadaļu «Mans tēls». Pārlādē lapu, lai mēģinātu vēlreiz. | ba20e6a1 |  |
| explore.detail.notFound.title | Not in the library | Nav katalogā | 304d4839 |  |
| explore.detail.notFound.body | This look is not in the library. It may have been renamed or taken out. | Šis tēls nav katalogā. Iespējams, tas ir pārdēvēts vai izņemts. | a9de39bf |  |
| explore.detail.notFound.action | Back to Explore | Atpakaļ uz izpēti | fe4c5295 |  |
| explore.stylist.picturesLabel | Library pictures of the look | Tēla attēli no kataloga | d22aa455 |  |
| explore.stylist.copyText | Copy as text | Kopēt kā tekstu | a1e9fce4 |  |
| explore.stylist.textCopied | Sheet copied | Lapa nokopēta | 12c2b9bf |  |
| explore.stylist.textCopiedLive | Stylist sheet copied as text. | Stilista lapa nokopēta kā teksts. | ffbea01e |  |
| explore.stylist.copyRefused | This browser did not allow copying. Use Save as image instead. | Šī pārlūkprogramma neļāva nokopēt. Tā vietā izmanto «Saglabāt kā attēlu». | 5d0fe2f3 |  |
| explore.stylist.saveImage | Save as image | Saglabāt kā attēlu | 272cdbb9 |  |
| explore.stylist.saving | Making the picture | Veido attēlu | 6605f83f |  |
| explore.stylist.shared | Stylist sheet shared. | Stilista lapa kopīgota. | 63876660 |  |
| explore.stylist.downloaded | Stylist sheet saved to your downloads. | Stilista lapa saglabāta lejupielādēs. | 81ac2afd |  |
| explore.stylist.saveFailed | The picture could not be made in this browser. Copy as text still works. | Šajā pārlūkprogrammā neizdevās izveidot attēlu. Joprojām vari izmantot «Kopēt kā tekstu». | 01dfa0c5 |  |
| explore.errors.not_built.title | The library is not in this build | Šajā versijā nav iekļauts katalogs | a041d9f1 |  |
| explore.errors.not_built.body | This copy of the app was built without its content. | Šī lietotnes versija ir izveidota bez satura. | 200d429d |  |
| explore.errors.offline.title | You are offline | Esi bezsaistē | 4d5c9439 |  |
| explore.errors.offline.body | This part of the library has not been opened on this device before. Connect to the internet to try again. | Šī kataloga daļa šajā ierīcē vēl nav atvērta. Pieslēdzies internetam, lai mēģinātu vēlreiz. | 0602f3b7 |  |
| explore.errors.missing.title | Part of the library is missing | Trūkst daļas no kataloga | b0a4103e |  |
| explore.errors.missing.body | A file the library needs was not found. Reloading the page brings the latest version. | Katalogam nepieciešamais fails netika atrasts. Pārlādējot lapu, tiks ielādēta jaunākā versija. | 88cb5859 |  |
| explore.errors.failed.title | The library could not load | Neizdevās ielādēt katalogu | 11bc5015 |  |
| explore.errors.failed.body | The file came back damaged on the way. A second try often works. | Fails lejupielādes laikā tika bojāts. Mēģinot vēlreiz, parasti izdodas. | 9c0c7991 |  |
| explore.errors.retry | Try again | Mēģināt vēlreiz | d8b8392e |  |
| consult.back | Back | Atpakaļ | 76900f1b |  |
| consult.continue | Continue | Turpināt | 31fbef16 |  |
| consult.starting | Opening My look | Atver sadaļu «Mans tēls» | 32f15622 |  |
| consult.notLoaded | My look could not open. It needs a connection the first time. | Neizdevās atvērt sadaļu «Mans tēls». Pirmajā reizē nepieciešams interneta savienojums. | 8c582991 |  |
| consult.photoAlt | Your main photo | Tavs galvenais foto | 576fa597 |  |
| consult.steps.photo | Add your photo | Pievieno savu foto | ea82622c |  |
| consult.steps.face | Your face card | Tava sejas kartīte | 3f76017c |  |
| consult.steps.goal | Your goal | Tavs mērķis | 617b0ae7 |  |
| consult.steps.questions | A few questions | Daži jautājumi | b3f8aa04 |  |
| consult.steps.ideas | Your ideas | Tavas idejas | 217e09cb |  |
| consult.steps.try-on | Try it on | Pielaiko | 9a0775ae |  |
| consult.steps.board | Board | Tēlu dēlis | 4816cbfd |  |
| consult.tools.firstTime | First time only: the face tools download (about 38 MB). Wi-Fi is best. | Tikai pirmajā reizē: tiek lejupielādēti sejas rīki (aptuveni 38 MB). Vislabāk ar Wi-Fi. | a5105634 |  |
| consult.tools.gettingReady | Getting the face tools ready | Sagatavo sejas rīkus | f23b8c01 |  |
| consult.tools.cancel | Cancel download | Atcelt lejupielādi | de5b23e6 |  |
| consult.tools.ready | Face tools ready | Sejas rīki ir gatavi | 3afb97ec |  |
| consult.tools.failed | The face tools could not load. | Neizdevās ielādēt sejas rīkus. | 4005324f |  |
| consult.tools.tryAgain | Try again | Mēģināt vēlreiz | d8b8392e |  |
| consult.tools.stopped | Download stopped. Download again? | Lejupielāde pārtrūka. Lejupielādēt vēlreiz? | 13cdd327 |  |
| consult.tools.stalled | The download stopped. Download again? | Lejupielāde apstājās. Lejupielādēt vēlreiz? | aa6089a1 |  |
| consult.tools.downloadAgain | Download again | Lejupielādēt vēlreiz | 54dde5ea |  |
| consult.tools.bootFailed | The face tools could not start. Reload the page to get the latest version. | Neizdevās palaist sejas rīkus. Pārlādē lapu, lai iegūtu jaunāko versiju. | 2a4cab1c |  |
| consult.tools.reload | Reload the page | Pārlādēt lapu | fdb61557 |  |
| consult.tools.unsupported | The face tools cannot run in this browser. Your ideas can come from your answers. | Šajā pārlūkprogrammā sejas rīki nedarbojas. Idejas vari iegūt no savām atbildēm. | f317fd80 |  |
| consult.tools.answersOnly | Continue with answers only | Turpināt tikai ar atbildēm | c5bea33f |  |
| consult.tools.missing.segmenter | Hair outline is not available on this device. | Matu kontūras noteikšana šajā ierīcē nav pieejama. | cf81e861 |  |
| consult.tools.missing.hand | Hand checks are not available on this device. | Roku pārbaude šajā ierīcē nav pieejama. | 5c0eb57b |  |
| consult.tools.missing.pose | Body pose is not available on this device. | Ķermeņa pozas noteikšana šajā ierīcē nav pieejama. | 91e11824 |  |
| consult.photo.guide.title | The photos that work best | Foto, kas der vislabāk | 8ac7607a |  |
| consult.photo.guide.lead | One clear photo from the front is enough, and you can add more angles. Stand about 1.5 m away in soft daylight, or ask someone to take it. | Pietiek ar vienu skaidru foto no priekšpuses, bet vari pievienot arī citus leņķus. Nostājies aptuveni 1,5 m attālumā maigā dienasgaismā vai palūdz kādam tevi nofotografēt. | f18fadf7 |  |
| consult.photo.guide.good.front | Front | No priekšpuses | a6175902 |  |
| consult.photo.guide.good.side | Side | No sāniem | 630ef00b |  |
| consult.photo.guide.good.back | Behind | No aizmugures | a2e92848 |  |
| consult.photo.guide.good.distance | Further away | No lielāka attāluma | a6d21a62 |  |
| consult.photo.guide.avoidTitle | Try to avoid | Centies izvairīties | 7973f730 |  |
| consult.photo.guide.avoid.close | Too close | Pārāk tuvu | 6690c1bc |  |
| consult.photo.guide.avoid.hand | Hand over your face | Roka priekšā sejai | b035521f |  |
| consult.photo.guide.avoid.turned | Head turned away | Pagriezta galva | 0d27f3af |  |
| consult.photo.guide.avoid.hidden | Hair hiding your hairline | Mati aizsedz matu augšanas līniju | 0a55598b |  |
| consult.photo.choose | Choose photos | Izvēlies foto | abc1dfd6 |  |
| consult.photo.camera | Take a photo | Uzņem foto | 996e6a73 |  |
| consult.photo.drop | You can also drop photos here or paste one. | Vari arī ievilkt foto šeit vai kādu ielīmēt. | eb7b2869 |  |
| consult.photo.privacy | The app never uploads your photos. It hands a copy only to the app you choose when you tap Share or Download. | Lietotne nekad neaugšupielādē tavas fotogrāfijas. Tā nodod kopiju vienīgi tavai izvēlētajai lietotnei, kad pieskaries «Kopīgot» vai «Lejupielādēt». | a532ada9 |  |
| consult.photo.withoutPhoto | Continue without a photo | Turpināt bez foto | f08806fc |  |
| consult.photo.reloaded | No photo is open here. | Šeit nav atvērts neviens foto. | e312cce0 |  |
| consult.photo.clearest | We looked at your 15 clearest photos. The others stay here; make one your main photo to analyse it. | Mēs apskatījām tavus 15 skaidrākos foto. Pārējie paliek šeit — iestati kādu par galveno foto, lai to analizētu. | 3399a02f |  |
| consult.photo.adding | Adding your photo | Pievienojam tavu foto | 582882e7 |  |
| consult.photo.notPhoto | The app can only add photos saved as JPEG, PNG, WebP or HEIC. | Lietotnē var pievienot tikai foto, kas saglabāti JPEG, PNG, WebP vai HEIC formātā. | a044ce25 |  |
| consult.photo.tooLarge | That photo is too large to open here, so add a smaller copy of it. | Šis foto ir pārāk liels, lai to šeit atvērtu, tāpēc pievieno mazāka izmēra kopiju. | 57bfd119 |  |
| consult.photo.listTitle | Your photos | Tavi foto | 640775cb |  |
| consult.photo.main | Main photo | Galvenais foto | 14b29400 |  |
| consult.photo.removeYes | Remove photo | Noņemt foto | f46512ab |  |
| consult.photo.removeNo | Keep photo | Paturēt foto | 18d73dbf |  |
| consult.photo.status.waiting | Waiting to be analysed | Gaida analīzi | d87cdd04 |  |
| consult.photo.status.analysing | Finding face points | Nosaka sejas punktus | abf763d8 |  |
| consult.photo.status.listed | Not analysed yet. Make it your main photo to analyse it. | Vēl nav analizēts. Iestati kā galveno foto, lai to analizētu. | 9efbbbd5 |  |
| consult.photo.status.ready | Face points found | Sejas punkti noteikti | 1c23f48e |  |
| consult.photo.issues.no_face | We could not find a face in this photo. The face may be turned too far or covered. Try a photo facing the camera. | Šajā foto neizdevās atrast seju. Iespējams, seja ir pārāk pagriezta vai aizsegta. Izmēģini foto ar skatu pret kameru. | dc3ee615 |  |
| consult.photo.issues.several_faces | This photo has more than one face. Choose a photo with only you. | Šajā foto ir vairākas sejas. Izvēlies foto, kurā esi tikai tu. | 9f15b6ac |  |
| consult.photo.issues.face_too_small | Your face is small in this photo. A closer photo gives better readings. | Šajā foto tava seja ir par mazu. Tuvāk uzņemts foto sniegs precīzākus rezultātus. | ccee4243 |  |
| consult.photo.issues.blurred | This photo is a little blurred. A sharper one gives steadier readings. | Šis foto ir nedaudz izplūdis. Asāks foto sniegs stabilākus rezultātus. | 1e442012 |  |
| consult.photo.issues.turned | Your head is turned in this photo, so we cannot read its proportions. Try a photo facing the camera, about an arm’s length or more away. | Šajā foto tava galva ir pagriezta, tāpēc nevaram noteikt sejas proporcijas. Izmēģini foto ar skatu pret kameru, aptuveni rokas stiepiena vai lielākā attālumā. | 49ad00c0 |  |
| consult.photo.issues.hand_over_face | A hand covers part of your face. A photo with your face clear works best. | Roka aizsedz daļu sejas. Vislabāk der foto, kurā seja ir skaidri redzama. | 2f882127 |  |
| consult.photo.issues.big_smile | A big smile changes the face shape a little. A relaxed face gives steadier readings. | Plats smaids nedaudz maina sejas formu. Atslābināta sejas izteiksme sniegs precīzākus rezultātus. | ca1edc57 |  |
| consult.photo.issues.close_selfie | Taken close up, so these are approximate (close-up photo). A photo from about 1.5 m gives steadier ones. | Uzņemts tuvplānā, tāpēc rezultāti ir aptuveni (tuvplāna foto). Foto no aptuveni 1,5 m attāluma sniegs precīzākus rezultātus. | 9ba2d817 |  |
| consult.photo.issues.hairline_hidden | Your hairline is hidden in this photo, so the notes that need it are skipped. | Šajā foto matu augšanas līnija ir aizsegta, tāpēc ieteikumi, kuriem tā nepieciešama, tiek izlaisti. | b8339254 |  |
| consult.photo.errors.decode_failed | This browser could not open this photo. Add a JPEG copy instead. On an iPhone, the camera setting "Most Compatible" makes one. | Šajā pārlūkprogrammā neizdevās atvērt šo foto. Tā vietā pievieno JPEG kopiju. iPhone tālrunī to var iestatīt kameras opcijā «Most Compatible». | 538d6d8a |  |
| consult.photo.errors.out_of_memory | This device ran out of memory on this photo. Try a smaller photo. | Ierīcei pietrūka atmiņas, lai apstrādātu šo foto. Izmēģini mazāku foto. | e3f78f64 |  |
| consult.photo.errors.other | This photo could not be analysed. Try another photo. | Šo foto neizdevās analizēt. Izmēģini citu foto. | 2f587661 |  |
| consult.colour.open | Try a colour on your photo | Izmēģini matu krāsu savā foto | 7641d945 |  |
| consult.colour.ready | Your photo is ready: try a colour | Tavs foto ir gatavs: izmēģini matu krāsu | 967d768f |  |
| consult.colour.title | Try a colour on your photo | Izmēģini matu krāsu savā foto | 7641d945 |  |
| consult.colour.realistic | Is it realistic for your hair? A few questions will tell. | Vai tas ir reāli iespējams taviem matiem? To noskaidrosim ar dažiem jautājumiem. | d927e437 |  |
| consult.goal.goalLegend | What would you like to change? | Ko tu vēlētos mainīt? | 2c029f3c |  |
| consult.goal.goals.cut | Cut | Griezums | 1f45f025 |  |
| consult.goal.goals.colour | Colour | Matu krāsa | 3a9dfa58 |  |
| consult.goal.goals.both | Both | Abus | b6c1d862 |  |
| consult.goal.collectionLegend | Show me | Rādīt | b76c42cb |  |
| consult.goal.collections.salon | Women's styles | Sieviešu griezumi | 14a1a295 |  |
| consult.goal.collections.barbering | Men's styles | Vīriešu griezumi | 4a12f551 |  |
| consult.goal.collections.all | All | Visi | a52ace42 |  |
| consult.goal.needBoth | Choose what to change and what to show, then continue. | Izvēlies, ko mainīt un ko rādīt, un tad turpini. | ea7e9233 |  |
| consult.questions.next | Next question | Nākamais jautājums | f7a9d743 |  |
| consult.questions.skip | Skip to my ideas | Pāriet uz manām idejām | df38f246 |  |
| consult.questions.tapHint | Tap an answer to go on | Pieskaries atbildei, lai turpinātu | caf7001c |  |
| consult.questions.none | There are no questions for this choice. | Šai izvēlei jautājumu nav. | f7021b82 |  |
| help.title | Help | Palīdzība | b79cac92 |  |
| help.all | All help | Visa palīdzība | ed77ba4d |  |
| help.topicsLabel | Help topics | Palīdzības tēmas | 138dc09b |  |
| help.topics.privacy | Privacy | Privātums | 54a57c31 |  |
| help.topics.method | How this is measured | Kā tas tiek mērīts | 02ecc0fc |  |
| help.topics.prompts | Using prompts | Promptu lietošana | 7d423e38 |  |
| help.topics.credits | Credits and licences | Pateicības un licences | fa950c05 |  |
| help.how.heading | How it works | Kā tas darbojas | 9c870aa6 |  |
| help.how.steps.0 | Add a photo. The app finds your face points and hair outline on your device. | Pievieno foto. Lietotne tavā ierīcē nosaka sejas punktus un matu kontūru. | b5ca232f |  |
| help.how.steps.1 | Answer a few questions about your hair and your routine. | Atbildi uz dažiem jautājumiem par saviem matiem un ikdienas kopšanu. | cedaafff |  |
| help.how.steps.2 | See ideas that suit your hair, with the reasons and what to ask your stylist. | Apskati idejas, kas piemērotas taviem matiem, ar skaidrojumu un jautājumiem, ko uzdot savam stilistam. | 95d35f9d |  |
| help.how.steps.3 | Try them on. The app writes the prompts, and pictures of you are made in your own ChatGPT or Gemini. Add them to your board. | Pielaiko tās. Lietotne sagatavo promptus, un tavi attēli top tavā ChatGPT vai Gemini. Pievieno tos savam dēlim. | 0ed9390c |  |
| help.feedback.heading | Feedback | Atsauksmes | aac77df3 |  |
| help.feedback.body | Tell us what worked and what did not. It helps the next person. | Pastāsti, kas izdevās un kas ne. Tas noderēs nākamajiem lietotājiem. | a3b70b42 |  |
| help.privacy.metricsHeading | What the app does not do | Ko lietotne nedara | 24eb9b5c |  |
| help.privacy.noAccounts | There are no analytics and no accounts. | Šeit nav ne analītikas, ne lietotāju kontu. | 12a01aac |  |
| help.privacy.metrics | MediaPipe, the tool that finds your face points, has built-in usage metrics. The app blocks them, so they are never sent. | Rīkam MediaPipe, kas nosaka sejas punktus, ir iebūvēta lietojuma metrika. Lietotne to bloķē, tāpēc dati nekad netiek nosūtīti. | 7ee7d004 |  |
| help.privacy.blockedUnknown | The count for this session could not be read. | Šīs sesijas rādījumu neizdevās nolasīt. | 2f052246 |  |
| help.privacy.storedHeading | What is stored, and where | Kas un kur tiek glabāts | 9890eb6d |  |
| help.privacy.stored.0.what | Your saved session | Tava saglabātā sesija | 00cddbd4 |  |
| help.privacy.stored.0.where | Saving is automatic. Opening Huecut saves nothing about you. Saving starts with your first answer or photo. It keeps your answers, your ideas, your AI pictures and one smaller photo of your face. That photo has no camera data and no record of where it was taken. All of it is kept in your browser on this device. By default it stays until you delete it or your browser clears it, so it is not a backup. If you choose Keep for 24 hours, it is deleted the next time the app runs after 24 hours. If you choose Delete and don't save, any saved copy is deleted. Nothing more is saved until you choose a period again. | Saglabāšana notiek automātiski. Atverot Huecut, par tevi nekas netiek saglabāts. Saglabāšana sākas tikai ar pirmo atbildi vai fotoattēlu. Tiek saglabātas tavas atbildes, idejas, AI attēli un viens samazināts tavas sejas fotoattēls. Šim fotoattēlam nav kameras datu un norāžu par uzņemšanas vietu. Viss tiek glabāts tavā pārlūkā šajā ierīcē. Pēc noklusējuma dati paliek, līdz tos izdzēs vai tavs pārlūks tos iztīra, tāpēc tā nav rezerves kopija. Ja izvēlies «Glabāt 24 stundas», tie tiek dzēsti nākamajā lietotnes atvēršanas reizē pēc 24 stundām. Ja izvēlies «Dzēst un nesaglabāt», visas saglabātās kopijas tiek dzēstas. Nekas cits netiek saglabāts, kamēr no jauna neizvēlies glabāšanas laiku. | 8b07526d |  |
| help.privacy.stored.1.what | Your other photos, previews and hair masks | Tavi pārējie fotoattēli, priekšskatījumi un matu maskas | c08b9ede |  |
| help.privacy.stored.1.where | In this page only. They go when you remove them, start again or close the tab. | Tikai šajā lapā. Tie pazūd, tiklīdz tos noņem, sāc no jauna vai aizver cilni. | 60a8e39d |  |
| help.privacy.stored.2.what | Favourites and settings | Izlase un iestatījumi | 81ab1abb |  |
| help.privacy.stored.2.where | The names of what you saved, your theme and motion settings and your last Explore filters, in your browser. Nothing personal. They stay until you delete them. | Saglabāto vienumu nosaukumi, tēmas un animāciju iestatījumi, kā arī pēdējie sadaļas «Atklāj» filtri tavā pārlūkā. Nekā personīga. Tie paliek, līdz tos izdzēs. | 5a7d9e45 |  |
| help.privacy.stored.3.what | App files, library pictures you have viewed and the face tools | Lietotnes faili, apskatītie bibliotēkas attēli un sejas rīki | 25721229 |  |
| help.privacy.stored.3.where | In your browser, so the app opens quickly and works offline. They stay until you delete them or your browser clears them. | Tavā pārlūkā, lai lietotne atvērtos ātri un darbotos bezsaistē. Tie glabājas, līdz tos izdzēs vai pārlūks tos iztīra. | 23af7cb1 |  |
| help.privacy.deleteHint | Delete my data on the Saved screen removes all of this. | Poga «Dzēst manus datus» sadaļā «Saglabātais» to visu izdzēš. | 34c81e7b |  |
| help.privacy.safari | Safari may clear stored data after 7 days without a visit. | Safari var iztīrīt saglabātos datus, ja lapa nav apmeklēta 7 dienas. | 5be4dd10 |  |
| help.privacy.sharedOrigin | This site shares its web address with other small sites by the same author. Sites on one address can read each other's browser storage, and they can change the offline copy of this app. If you do not want your session stored here, choose Delete and don't save; it does not protect the offline copy. | Šī vietne dala tīmekļa adresi ar citām šī paša autora nelielajām vietnēm. Vietnes ar vienu adresi var nolasīt viena otras pārlūka krātuvi un mainīt šīs lietotnes bezsaistes kopiju. Ja nevēlies, lai tava sesija šeit tiktu saglabāta, izvēlies «Dzēst un nesaglabāt»; tas neaizsargā bezsaistes kopiju. | 276ec102 |  |
| help.privacy.testHeading | Test it yourself | Pārbaudi pats | 231382be |  |
| help.privacy.airplane | After the face tools have loaded once, switch on airplane mode. The app still opens and reads your photo. Pictures and extra tools you have not opened yet need a connection. | Kad sejas rīki ir vienreiz ielādējušies, ieslēdz lidojuma režīmu. Lietotne joprojām atvērsies un nolasīs tavu fotoattēlu. Attēliem un papildu rīkiem, kurus vēl neesi atvēris, būs nepieciešams interneta pieslēgums. | 919f1da1 |  |
| help.privacy.offline | After the first visit, what you have used works offline. | Pēc pirmā apmeklējuma viss, ko jau esi izmantojis, darbojas bezsaistē. | 4950a4a8 |  |
| help.method.intro | The app finds points on your face and an outline of your hair, on your device. It turns them into a few proportions. They are compared only with your own face, never with anyone else. | Lietotne tavā ierīcē nosaka sejas punktus un matu kontūru, pārvēršot tos dažās proporcijās. Tās tiek salīdzinātas tikai ar tavu seju, nekad ar kādu citu. | 47370d75 |  |
| help.method.estimatesHeading | Estimates | Aptuvens novērtējums | 383778e1 |  |
| help.method.estimates | Every number is an estimate. Without your camera’s details we cannot tell how far away it was. So treat the readings as a good guess. A photo taken close up bends the proportions. When we can tell, the reading says "approximate (close-up photo)". Treat every result as an opinion to take to your stylist. | Katrs skaitlis ir tikai aptuvens. Bez kameras datiem nevaram noteikt, cik tālu tā atradās, tāpēc uztver šos rādījumus kā labu minējumu. Tuvplānā uzņemts fotoattēls izkropļo proporcijas. Kad to spējam pamanīt, rādījumā ir teikts «aptuveni (tuvplāna foto)». Uztver katru rezultātu kā viedokli, ko pārrunāt ar savu stilistu. | b21a77ce |  |
| help.method.hintsHeading | Hints | Norādes | 6f3951c4 |  |
| help.method.hints | Colour readings are hints, because the light in a photo changes them. Your undertone is always your own answer. It is never read from the photo. | Matu krāsas rādījumi ir tikai orientējoši, jo apgaismojums fotoattēlā tos maina. Tavs ādas apakštonis vienmēr ir tava atbilde — no fotoattēla tas nekad netiek nolasīts. | 4b38929e |  |
| help.method.preferenceHeading | Our styling preference | Mūsu stila pieeja | 6c1ef557 |  |
| help.method.preference | Your hair, your routine and what you asked for come first. When a photo gives face numbers, the app also sorts the cuts that fit those by what each cut does around your face. That part is this app’s own styling preference, and no face needs changing. If you tell us what you want, you can keep your proportions, play them up or balance them. With no wish, you get a mix of those. | Tavi mati, tava ikdiena un tavas vēlmes ir pirmajā vietā. Kad fotoattēls sniedz sejas proporciju datus, lietotne atlasītos griezumus sarindo arī pēc tā, kā katrs griezums izskatās ap tavu seju. Tā ir šīs lietotnes pašas stila pieeja, un nevienai sejai nekas nav jāmaina. Ja pastāsti, ko vēlies, vari savas proporcijas saglabāt, akcentēt vai līdzsvarot. Ja īpašu vēlmju nav, saņemsi ieteikumus no visa pa druskai. | 2801e35e |  |
| help.method.phonesHeading | Phones and tablets | Tālruņi un planšetdatori | 578553d2 |  |
| help.method.phones | The 3D view and Refine my hair outline run on computers only in this version. In a test that slowed a computer down to act like a phone, they used too much memory or ran too slowly. That test is preliminary, and the app has not been tried on real phones. | Šajā versijā 3D skats un funkcija «Precizēt matu kontūru» darbojas tikai datoros. Testā, kurā dators tika mākslīgi palēnināts, lai atdarinātu tālruni, šīs funkcijas patērēja pārāk daudz atmiņas vai darbojās pārāk lēni. Šis tests ir provizorisks, un lietotne nav pārbaudīta uz īstiem tālruņiem. | 852862f0 |  |
| help.method.labelsHeading | Colour labels | Krāsu norādes | edf0f7fe |  |
| help.method.labels | Each colour idea has one of three labels. They are Plausible, Uncertain or Best done by a colourist. Each says why and what to ask. Plausible is never shown on a guess. If a missing answer could change it, the label is Uncertain until you answer. | Katrai matu krāsas idejai ir viena no trim norādēm: «Reālistiski», «Nav pārliecības» vai «Vislabāk uzticēt koloristam». Katra no tām paskaidro iemeslu un to, ko jautāt. Norāde «Reālistiski» nekad netiek rādīta pēc minējuma. Ja trūkstoša atbilde to varētu mainīt, būs redzama norāde «Nav pārliecības», līdz atbildēsi. | 0adb24d1 | safety; checked |
| help.method.silver | With mostly grey hair, a silver gloss mostly tones the grey you already have. The label counts it as lightening from your darkest strands, so it can be more cautious than you need. | Ja mati lielākoties ir sirmi, sudraba gloss galvenokārt tonē tavus esošos sirmos matus. Norāde to aprēķina kā gaišināšanu no tavām tumšākajām šķipsnām, tāpēc tā var būt piesardzīgāka, nekā patiesībā nepieciešams. | b6d295e8 |  |
| help.method.toolsHeading | Tools on this device | Rīki šajā ierīcē | 949b82e3 |  |
| help.method.toolOn | Works on this device. | Darbojas šajā ierīcē. | 264c20d3 |  |
| help.method.tools.depth | See it in 3D | Skatīt 3D | b8060d34 |  |
| help.method.tools.sam | Refine my hair outline | Precizēt matu kontūru | 1553fd9a |  |
| help.method.toolsReading | Checking this device. | Pārbauda šo ierīci. | a73065c3 |  |
| help.prompts.stepsHeading | From prompt to picture | No prompta līdz attēlam | 910a59c1 |  |
| help.prompts.steps.0 | Tap Copy prompt on an idea. | Pie idejas spied «Kopēt promptu». | 1f76a5be |  |
| help.prompts.steps.1 | Open ChatGPT or Gemini and start a new chat. | Atver ChatGPT vai Gemini un sāc jaunu čatu. | d3251f36 |  |
| help.prompts.steps.2 | Attach your photo and paste the prompt. | Pievieno savu fotoattēlu un ielīmē promptu. | 6283e34b |  |
| help.prompts.steps.3 | Save the picture it makes, then come back and add it on Try it on. | Saglabā izveidoto attēlu, atgriezies šeit un pievieno to sadaļā «Pielaiko». | 6ef92841 |  |
| help.prompts.tipsHeading | Tips | Padomi | 3838a4d8 |  |
| help.prompts.tips.0 | Start a new chat for each look. | Katram tēlam sāc jaunu čatu. | d291da95 |  |
| help.prompts.tips.1 | Always attach your own photo, never an AI picture. | Vienmēr pievieno savu īsto fotoattēlu, nekad AI attēlu. | 430f035b |  |
| help.prompts.tips.2 | We ask the AI to keep your face, skin tone, eye colour and glasses. It should also keep your hairline, density, curl pattern, beard and background. | Mēs lūdzam AI saglabāt tavus sejas pantus, ādas toni, acu krāsu un brilles. Tam jāsaglabā arī tava matu augšanas līnija, biezums, loku forma, bārda un fons. | d97005ca |  |
| help.prompts.tips.3 | If the face looks different, Face looks different? copies a short repair prompt for the same chat. | Ja seja izskatās citāda, poga «Seja izskatās citādi?» nokopē īsu labošanas promptu tam pašam čatam. | 93a16e75 |  |
| help.prompts.tips.4 | AI often gives more hair or a fuller hairline than you have. Your stylist knows what your hair can do. | AI nereti parāda biezākus matus vai pilnīgāku matu augšanas līniju, nekā tev ir. Tavs stilists zina, ko ar taviem matiem patiesībā var panākt. | 8892f20d |  |
| help.credits.authorHeading | Developed by Michael | Izstrādāja Michael | 0a74ed20 |  |
| help.credits.author | Huecut is designed and developed by Michael (SacitDev on GitHub). | Huecut dizainu un izstrādi veidojis Michael (SacitDev vietnē GitHub). | 4634e601 |  |
| help.credits.keepNotice | If you reuse or change this code, the MIT licence says you must keep this notice. Copyright (c) 2026 Michael (SacitDev) | Ja atkārtoti izmanto vai maini šo kodu, saskaņā ar MIT licenci tev jāsaglabā šis paziņojums. Copyright (c) 2026 Michael (SacitDev) | 50a52b98 |  |
| help.credits.app | Huecut is free and open source under the MIT licence. | Huecut ir bezmaksas un atvērtā pirmkoda lietotne saskaņā ar MIT licenci. | ceb81774 |  |
| help.credits.pictures | The models in the library are fictional. Their pictures are made as illustrations. They use the same licence as the app. | Bibliotēkā redzamie modeļi ir izdomāti. To attēli ir veidoti kā ilustrācijas. Tiem ir tāda pati licence kā lietotnei. | dc53b03d |  |
| help.credits.heading | Tools and fonts the app runs on | Rīki un fonti, ko izmanto lietotne | 3dcf2816 |  |
| help.credits.items.0 | MediaPipe Tasks Vision with its face, hand, pose and hair models: Apache 2.0. | MediaPipe Tasks Vision ar sejas, roku, pozu un matu modeļiem: Apache 2.0. | fc0009fe |  |
| help.credits.items.1 | ONNX Runtime Web: MIT. | ONNX Runtime Web: MIT. | 4c8d4cf5 | same |
| help.credits.items.2 | Transformers.js: Apache 2.0. | Transformers.js: Apache 2.0. | bf9c46a8 | same |
| help.credits.items.3 | Depth Anything V2 Small: Apache 2.0. | Depth Anything V2 Small: Apache 2.0. | b27e7554 | same |
| help.credits.items.4 | SAM 2.1 Hiera Tiny: Apache 2.0. | SAM 2.1 Hiera Tiny: Apache 2.0. | 8a00b1ab | same |
| help.credits.items.5 | React, XState and Three.js: MIT. | React, XState un Three.js: MIT. | b631c27a |  |
| help.credits.items.6 | Comlink: Apache 2.0. | Comlink: Apache 2.0. | 701905b3 | same |
| help.credits.items.7 | Bricolage Grotesque and Figtree fonts: SIL Open Font License 1.1. | Fonti Bricolage Grotesque un Figtree: SIL Open Font License 1.1. | 9b95a757 |  |
| help.credits.items.8 | Phosphor icons: MIT. | Phosphor ikonas: MIT. | c1fa89ca |  |
| help.credits.more | Every licence in full: | Visas licences pilnā apjomā: | 9f3a6ed3 |  |
| help.credits.licenceLinks.thirdParty | tools, fonts and models | rīki, fonti un modeļi | b4e0e932 |  |
| help.credits.licenceLinks.own | Huecut (MIT) | Huecut (MIT) | 025d06b9 | same |
| help.install.heading | Use it like an app | Lieto kā lietotni | 6da08f7f |  |
| help.install.body | You can add Huecut to your phone or computer and open it like an app. An installed app still keeps your data only on this device, so it is not a backup. On iPhone, installing makes it less likely that the browser clears your data, but it can still happen. | Vari pievienot Huecut savam tālrunim vai datoram un atvērt to kā lietotni. Arī instalēta lietotne datus glabā tikai šajā ierīcē, tāpēc tā nav rezerves kopija. iPhone instalēšana samazina iespēju, ka pārlūks izdzēsīs tavus datus, taču tas joprojām var notikt. | a60c0340 |  |
| help.install.button | Install Huecut | Instalēt Huecut | 6a5bcb64 |  |
| help.install.ios | Share, then Add to Home Screen | «Kopīgot», pēc tam «Pievienot sākuma ekrānam» | 32f961b9 |  |
| help.offline | You are offline. Explore and anything you have already used still work. | Tu esi bezsaistē. Sadaļa «Atklāj» un viss, ko jau esi izmantojis, joprojām darbojas. | 6889b6a1 |  |
| save.heading | Saving this session | Šīs sesijas saglabāšana | 041a7b1e |  |
| save.shared | Saving keeps your answers and a smaller photo of your face. Anyone using this browser can see them, so do not use it on a shared computer. | Saglabājot tiek paturētas tavas atbildes un mazāks sejas fotoattēls. Tos var redzēt ikviens šī pārlūka lietotājs, tāpēc neizmanto šo iespēju koplietošanas datorā. | 26a95dda |  |
| save.told | When saving is on, it keeps your ideas and any AI pictures you add too. They stay in this browser on this device until you delete them or the browser clears them. So this is not a backup. | Kad saglabāšana ir ieslēgta, tiek saglabātas arī tavas idejas un visas pievienotās AI bildes. Tās paliek šīs ierīces pārlūkā, līdz tās izdzēs vai pārlūks tās iztīra. Tāpēc tā nav rezerves kopija. | ef66e39a |  |
| save.more | What is kept | Kas tiek saglabāts | 20a89932 |  |
| save.choose | How long to keep this session | Cik ilgi glabāt šo sesiju | f22dd9ad |  |
| save.modes.until_deleted | Keep until I delete it | Glabāt, līdz izdzēšu | 1b112f89 |  |
| save.modes.day | Keep for 24 hours | Glabāt 24 stundas | c9ef416e |  |
| save.modes.off | Delete and don't save | Dzēst un nesaglabāt | 90163290 |  |
| save.rules | Keep for 24 hours deletes it the next time the app runs after 24 hours. Delete and don't save removes any saved copy now, for good. Then nothing is saved until you choose a period again. | Izvēloties «Glabāt 24 stundas», dati tiek dzēsti nākamajā lietotnes atvēršanas reizē pēc 24 stundām. Izvēloties «Dzēst un nesaglabāt», saglabātā kopija tiek tūlīt neatgriezeniski dzēsta. Pēc tam nekas netiek saglabāts, kamēr no jauna neizvēlies termiņu. | c4a51ad4 |  |
| save.change | Change saving | Mainīt saglabāšanu | dfeeafc6 |  |
| save.hide | Close | Aizvērt | 7d9eb7ac |  |
| save.replace | Replace it | Aizstāt | 7485abff |  |
| save.start | Find my look | Atrast savu tēlu | dfee3056 |  |
| save.example | You are looking at an example, so nothing is saved. | Tu skaties piemēru, tāpēc nekas netiek saglabāts. | 2029c81b |  |
| save.status.nothing | Nothing is saved yet. | Pagaidām nekas nav saglabāts. | 63b7332e |  |
| save.status.saving | Saving | Saglabā... | 096b7362 |  |
| save.status.untilDeleted | Saved on this device until you delete it. | Saglabāts šajā ierīcē, līdz to izdzēsīsi. | 02e4327d |  |
| save.status.underAnHour | Less than an hour left. | Atlicis mazāk par stundu. | e32de82a |  |
| save.status.off | Not saved on this device. | Šajā ierīcē nav saglabāts. | e08942fd |  |
| save.status.undeleted | Could not delete it. Close other tabs and reload. | Neizdevās izdzēst. Aizver citas cilnes un pārlādē lapu. | 6a1c07d0 |  |
| save.status.lastGood | Could not save. Your last save is still here. | Neizdevās saglabāt. Pēdējais saglabātais variants joprojām ir šeit. | e7d96b83 |  |
| save.status.notSaved | Could not save. Keep this tab open. | Neizdevās saglabāt. Paturi šo cilni atvērtu. | 96104a55 |  |
| save.status.taken | Another session is saved here. Replace it? | Šeit jau ir saglabāta cita sesija. Vai aizstāt to? | 931a45ca |  |
| saved.title | Saved | Saglabātie | b5c120b3 |  |
| saved.favourites.heading | Your favourites | Tava izlase | 0abfa8ad |  |
| saved.favourites.groups.cut | Styles | Griezumi | 3626e7fd |  |
| saved.favourites.groups.colour | Colour looks | Krāsojumi | 1e3eace5 |  |
| saved.favourites.groups.beard | Beards | Bārdas | 4a8a7a45 |  |
| saved.favourites.empty | No favourites yet. Tap the heart on a style, colour look or beard in Explore to keep it here. | Izlasē vēl nekā nav. Sadaļā «Atklāj» pieskaries sirsniņai pie griezuma, krāsu tēla vai bārdas, lai saglabātu to šeit. | bdcff5cb |  |
| saved.favourites.explore | Explore styles and colours | Pārlūkot griezumus un krāsas | 3440f7b3 |  |
| saved.favourites.failed | Your favourites could not be shown. They need a connection the first time. | Neizdevās parādīt tavu izlasi. Pirmajā reizē ir nepieciešams interneta savienojums. | 0e019e0a |  |
| saved.session.heading | This session | Šī sesija | 6da6530a |  |
| saved.data.heading | Your data on this device | Tavi dati šajā ierīcē | 157c6934 |  |
| saved.data.delete | Delete my data | Dzēst manus datus | 5c465323 |  |
| saved.data.ask | This deletes your favourites and your theme and motion settings. It deletes your saved session with its photo and pictures, and your saving choice. It also deletes the library pictures you have viewed and the face tools you downloaded. The photos open in My look are cleared too. If you chose Delete and don't save, that choice stays, so nothing is saved until you choose a period again. | Tas dzēsīs tavu izlasi, kā arī motīva un kustību iestatījumus. Tiks dzēsta tava saglabātā sesija ar fotoattēlu un bildēm, kā arī tava saglabāšanas izvēle. Tiks dzēstas arī bibliotēkā apskatītās bildes un lejupielādētie sejas rīki. Tiks noņemti arī fotoattēli, kas atvērti sadaļā «Mans tēls». Ja izvēlējies «Dzēst un nesaglabāt», šī izvēle paliks spēkā, tāpēc nekas netiks saglabāts, kamēr no jauna neizvēlēsies termiņu. | a1f4c15f |  |
| saved.data.yes | Yes, delete my data | Jā, dzēst manus datus | 3b0e4321 |  |
| saved.data.no | Keep my data | Paturēt manus datus | 891e641d |  |
| saved.data.busy | Deleting your data | Dzēš tavus datus | 173da0b2 |  |
| saved.data.done | Your data was deleted from this device. | Tavi dati no šīs ierīces ir izdzēsti. | a7f00e83 |  |
| saved.data.partly | Some of your data could not be deleted. Try again with other tabs of this app closed. | Daļu tavu datu neizdevās izdzēst. Aizver citas šīs lietotnes cilnes un mēģini vēlreiz. | 758e4eba |  |
| saved.example.badge | Example | Piemērs | d029f87e |  |
| saved.example.another | Try another model | Izmēģināt citu modeli | 35c33307 |  |
| saved.example.mine | Start with my photo | Sākt ar savu fotoattēlu | de022a34 |  |
| saved.example.failed | The example could not open. It needs a connection the first time. | Neizdevās atvērt piemēru. Pirmajā reizē ir nepieciešams interneta savienojums. | dacab442 |  |
| saved.example.tryAgain | Try again | Mēģināt vēlreiz | d8b8392e |  |
| tryOn.intro | See your looks on you, in your own ChatGPT or Gemini. Choose how you would like them. | Ieraugi, kā šie tēli izskatās tev, savā ChatGPT vai Gemini. Izvēlies, kā vēlies tos apskatīt. | 0ab5262f |  |
| tryOn.tabs.label | Ways to try your looks | Veidi, kā pielaikot tēlus | ebb449d7 |  |
| tryOn.tabs.names.together | All together | Visus kopā | 8a5a7e64 |  |
| tryOn.tabs.names.single | One by one | Pa vienam | 3b63fc61 |  |
| tryOn.tabs.names.pictures | My pictures | Manas bildes | 74823485 |  |
| tryOn.tabs.names.tips | Tips | Padomi | 3838a4d8 |  |
| tryOn.cards.howMany | How many looks in one picture? | Cik tēlu vienā bildē? | 2ee8f241 |  |
| tryOn.cards.onCard | On the card: | Uz kartītes: | 51c69e8a |  |
| tryOn.cards.steps.touch | Tap 1, then tap 2 and choose ChatGPT or Gemini. Paste the prompt, send, and save the card it makes. No ChatGPT or Gemini in the list? Save the files there, then tap Copy and open ChatGPT or Gemini, attach them and paste. | Nospied 1, pēc tam 2 un izvēlies ChatGPT vai Gemini. Ielīmē uzvedni, nosūti un saglabā izveidoto kartīti. Sarakstā nav ChatGPT vai Gemini? Saglabā failus turpat, pēc tam nospied «Kopēt», atver ChatGPT vai Gemini, pievieno tos un ielīmē. | 08ed65e6 |  |
| tryOn.cards.steps.touchNoPhoto | Tap 1, then tap 2 and choose ChatGPT or Gemini. Attach your own photos there, paste the prompt, send, and save the card it makes. No ChatGPT or Gemini in the list? Save the sheet there, then tap Copy and open ChatGPT or Gemini, attach it with your photos and paste. | Nospied 1, pēc tam 2 un izvēlies ChatGPT vai Gemini. Pievieno tur savus fotoattēlus, ielīmē uzvedni, nosūti un saglabā izveidoto kartīti. Sarakstā nav ChatGPT vai Gemini? Saglabā lapu turpat, pēc tam nospied «Kopēt», atver ChatGPT vai Gemini, pievieno to kopā ar saviem fotoattēliem un ielīmē. | 26cb82a0 |  |
| tryOn.cards.steps.desktop | Copy the prompt and open a chat. Attach your photos and the reference sheet, paste the prompt and send. Save the card it makes. | Nokopē uzvedni un atver čatu. Pievieno savus fotoattēlus un paraugu lapu, ielīmē uzvedni un nosūti. Saglabā izveidoto kartīti. | cdc5743b |  |
| tryOn.cards.steps.desktopNoPhoto | Copy the prompt and open a chat. Attach your own photos and the reference sheet, paste the prompt and send. Save the card it makes. | Nokopē uzvedni un atver čatu. Pievieno savus fotoattēlus un paraugu lapu, ielīmē uzvedni un nosūti. Saglabā izveidoto kartīti. | f53d1fb7 |  |
| tryOn.cards.share | 2 Share photos and reference sheet | 2 Kopīgot fotoattēlus un paraugu lapu | 88a3c5d7 |  |
| tryOn.cards.shareSheet | 2 Share reference sheet | 2 Kopīgot paraugu lapu | b19fe260 |  |
| tryOn.cards.downloadSheet | Download reference sheet | Lejupielādēt paraugu lapu | ec8206f4 |  |
| tryOn.cards.downloadPhotos | Download my photos | Lejupielādēt manus fotoattēlus | 0f639229 |  |
| tryOn.cards.sheetSaved | The reference sheet is in your downloads. | Paraugu lapa ir tavās lejupielādēs. | c938ea07 |  |
| tryOn.cards.photosSaved | Your photos are in your downloads. | Tavi fotoattēli ir tavās lejupielādēs. | b0239dd6 |  |
| tryOn.cards.shared | Your files went to the app you chose. | Tavi faili tika nosūtīti uz izvēlēto lietotni. | 9776376c |  |
| tryOn.cards.downloaded | Your files are in your downloads. Attach them in ChatGPT or Gemini. | Tavi faili ir tavās lejupielādēs. Pievieno tos ChatGPT vai Gemini. | 0a134a9c |  |
| tryOn.cards.sheetFailed | The reference sheet could not be made in this browser. One by one still works. | Šajā pārlūkā neizdevās izveidot paraugu lapu. Joprojām vari mēģināt pa vienam. | 6c137f03 |  |
| tryOn.cards.disclosure | These are AI pictures, illustrations of the looks. AI can change a name or a face, so compare the card with this list. | Šīs ir mākslīgā intelekta bildes – tēlu ilustrācijas. Mākslīgais intelekts var mainīt nosaukumu vai seju, tāpēc salīdzini kartīti ar šo sarakstu. | c62e68a8 |  |
| tryOn.cards.none | There is nothing to put on a card yet. | Pagaidām nav nekā, ko iekļaut kartītē. | ff947260 |  |
| tryOn.handoff.steps.touch | Tap 1, then tap 2 and choose ChatGPT or Gemini. Paste the prompt and send. No ChatGPT or Gemini in the list? Tap Copy and open ChatGPT or Gemini, attach your photo there and paste. | Nospied 1, pēc tam 2 un izvēlies ChatGPT vai Gemini. Ielīmē uzvedni un nosūti. Sarakstā nav ChatGPT vai Gemini? Nospied «Kopēt», atver ChatGPT vai Gemini, pievieno tur savu fotoattēlu un ielīmē. | cc7d8f14 |  |
| tryOn.handoff.steps.touchNoPhoto | Tap 1, then open ChatGPT or Gemini and attach your own photo there. Paste the prompt and send. | Nospied 1, tad atver ChatGPT vai Gemini un pievieno tur savu foto. Ielīmē uzvedni un nosūti. | a8219df1 |  |
| tryOn.handoff.steps.desktop | Open a chat, attach your photo, paste the prompt and send. | Atver čatu, pievieno foto, ielīmē uzvedni un nosūti. | 0ef6c304 |  |
| tryOn.handoff.steps.desktopNoPhoto | Open a chat, attach your own photo, paste the prompt and send. | Atver čatu, pievieno savu foto, ielīmē uzvedni un nosūti. | b11e6365 |  |
| tryOn.handoff.privacy | The app never uploads your photos. It hands a copy only to the app you choose when you tap Share or Download. | Lietotne nekad neaugšupielādē tavas fotogrāfijas. Tā nodod kopiju vienīgi tavai izvēlētajai lietotnei, kad pieskaries «Kopīgot» vai «Lejupielādēt». | a532ada9 |  |
| tryOn.handoff.copyPrompt | 1 Copy prompt | 1 Kopēt uzvedni | 3200e9ed |  |
| tryOn.handoff.sharePhoto | 2 Share photo | 2 Kopīgot foto | 34391da0 |  |
| tryOn.handoff.openAnApp | 2 Open ChatGPT or Gemini | 2 Atvērt ChatGPT vai Gemini | 51ee2888 |  |
| tryOn.handoff.preparing | Getting your photo ready | Sagatavojam tavu foto | 3c62a820 |  |
| tryOn.handoff.downloadPhoto | Download photo for AI | Lejupielādēt foto mākslīgajam intelektam | 0fba042b |  |
| tryOn.handoff.copyOpenChatGpt | Copy and open ChatGPT | Kopēt un atvērt ChatGPT | 7999bbbe |  |
| tryOn.handoff.copyOpenGemini | Copy and open Gemini | Kopēt un atvērt Gemini | 7dd8d748 |  |
| tryOn.handoff.newTab | (opens in a new tab) | (atveras jaunā cilnē) | 1d183356 |  |
| tryOn.handoff.shared | Your photo went to the app you chose. | Tavs foto ir nosūtīts uz izvēlēto lietotni. | d1fd391f |  |
| tryOn.handoff.downloaded | Your photo is in your downloads. Attach it in ChatGPT or Gemini. | Tavs foto ir lejupielādēs. Pievieno to ChatGPT vai Gemini. | 55937e4b |  |
| tryOn.handoff.photoFailed | Your photo could not be prepared in this browser. Attach it in ChatGPT or Gemini yourself. | Šajā pārlūkprogrammā neizdevās sagatavot tavu foto. Pievieno to ChatGPT vai Gemini manuāli. | 8160bde8 |  |
| tryOn.handoff.selectAll | Select all | Atlasīt visu | 1fc9a387 |  |
| tryOn.keepList | We ask the AI to keep your face, skin tone, eye colour and glasses. It should also keep your hairline, density, curl pattern, beard and background. | Mēs lūdzam AI saglabāt tavus sejas pantus, ādas toni, acu krāsu un brilles. Tam jāsaglabā arī tava matu augšanas līnija, biezums, loku forma, bārda un fons. | d97005ca |  |
| tryOn.referral | Best done by a colourist | Vislabāk uzticēt koloristam | 416f2703 | safety; checked |
| tryOn.details.loading | Getting the prompts ready | Sagatavojam uzvednes | d50ddf4e |  |
| tryOn.details.failed | The prompts could not load. They need a connection the first time. | Neizdevās ielādēt uzvednes. Pirmajā reizē ir vajadzīgs interneta savienojums. | 9b822e1f |  |
| tryOn.details.retry | Try again | Mēģināt vēlreiz | d8b8392e |  |
| tryOn.pair.title | Try together | Pielaikot kopā | ae26b118 |  |
| tryOn.pictures.intro | Save each picture your chat makes and add it here. They go on your board. | Saglabā katru čatā izveidoto bildi un pievieno to šeit. Tās nonāks tavā tēlu dēlī. | fc19cc05 |  |
| tryOn.pictures.touchHow | To save a picture, press and hold it, then Save to Photos. | Lai saglabātu bildi, nospied un paturi to, pēc tam izvēlies «Saglabāt fotoattēlos». | 23d5d93d |  |
| tryOn.pictures.list | Your looks | Tavi tēli | 2ef0baf7 |  |
| tryOn.grids.title | Several pictures at once | Vairākas bildes uzreiz | 0d310a1b |  |
| tryOn.grids.intro | One prompt asks for up to 4 looks in one picture, without text. Add the picture here and the app cuts it into one picture per look. | Viena uzvedne lūdz izveidot līdz 4 tēliem vienā bildē bez teksta. Pievieno šo bildi šeit, un lietotne to sadalīs pa vienai bildei katram tēlam. | 7c4c5cad |  |
| tryOn.grids.asks | Looks in this picture, left to right and top to bottom: | Tēli šajā bildē: no kreisās uz labo un no augšas uz leju: | 382002d5 |  |
| tryOn.grids.add | Add this picture | Pievienot šo bildi | 2a75bb5b |  |
| tryOn.grids.replace | Add another picture | Pievienot citu bildi | 868c74bb |  |
| tryOn.grids.cutting | Cutting the picture into tiles | Sadalām bildi daļās | 9fd7dd0c |  |
| tryOn.grids.lost | This picture is no longer on this device. Add it again to cut it into tiles. | Šī bilde vairs nav šajā ierīcē. Pievieno to vēlreiz, lai sadalītu daļās. | bc5f687c |  |
| tryOn.grids.confirmTitle | Which look does each tile show? | Kuru tēlu attēlo katra daļa? | f26a5ead |  |
| tryOn.grids.confirmHint | Move the names until each one sits next to its tile. Names are attached only when you confirm. | Pārvieto nosaukumus, līdz katrs atrodas pie savas daļas. Nosaukumi tiks piesaistīti tikai tad, kad apstiprināsi. | 5a60362f |  |
| tryOn.grids.moveEarlier | Move earlier | Pārvietot atpakaļ | 736612d4 |  |
| tryOn.grids.moveLater | Move later | Pārvietot tālāk | d6e85608 |  |
| tryOn.grids.confirm | Attach these names | Piesaistīt šos nosaukumus | 32c677ca |  |
| tryOn.grids.attached | Names attached. Each tile is now the picture for its look, unless the look already had one. | Nosaukumi piesaistīti. Katra daļa tagad ir sava tēla bilde, ja vien tēlam jau nebija savas bildes. | 404a8424 |  |
| tryOn.grids.tilesWrong | Tiles look wrong? | Daļas neizskatās, kā vajadzētu? | d1575b70 |  |
| tryOn.grids.perIdea | One picture per look instead: use One by one, then the Add picture slots here. | Ja vēlies atsevišķu bildi katram tēlam, izmanto «Pa vienam» un pievieno bildes šeit paredzētajās vietās. | 67a08940 |  |
| tryOn.looks.intro | One prompt per look gives a closer picture. | Viena uzvedne katram tēlam ļauj iegūt tuvāku bildi. | 3f72e635 |  |
| tryOn.slot.add | Add picture | Pievienot bildi | 1c75e2ed |  |
| tryOn.slot.replace | Replace picture | Aizstāt bildi | 00d4a157 |  |
| tryOn.slot.remove | Remove picture | Noņemt bildi | 1bc6f23b |  |
| tryOn.slot.dropHint | Or paste a picture (Ctrl+V) or drop one here. | Vai ielīmē bildi (Ctrl+V) vai ievelc to šeit. | 8b47c4ae |  |
| tryOn.slot.notImage | That file is not a picture. Choose a JPEG, PNG or WebP picture. | Šis fails nav bilde. Izvēlies JPEG, PNG vai WebP bildi. | 4db164e8 |  |
| tryOn.slot.tooLarge | That picture is too large to open here, so add a smaller copy of it. | Šī bilde ir pārāk liela, lai to šeit atvērtu, tāpēc pievieno mazāku kopiju. | b69d3676 |  |
| tryOn.repair.button | Face looks different? | Seja izskatās citāda? | 390b65eb |  |
| tryOn.repair.copied | Repair prompt copied. Paste it into the same chat. | Labojuma uzvedne nokopēta. Ielīmē to tajā pašā čatā. | 74decf6b |  |
| tryOn.repair.hint | Copies a short prompt for the same chat that asks the AI to start again from your photo. | Nokopē īsu uzvedni tam pašam čatam, lūdzot mākslīgajam intelektam sākt no jauna ar tavu foto. | adcec1b2 |  |
| tryOn.repair.refused | This browser did not allow copying. Copy this prompt by hand: | Šī pārlūkprogramma neļāva nokopēt. Nokopē šo uzvedni manuāli: | 7ecacce8 |  |
| tryOn.tips.list.0 | Start a new chat for each look. | Katram tēlam sāc jaunu čatu. | d291da95 |  |
| tryOn.tips.list.1 | Always attach your own photo, never an AI picture. | Vienmēr pievieno savu īsto fotoattēlu, nekad AI attēlu. | 430f035b |  |
| tryOn.tips.honest | AI often gives more hair or a fuller hairline than you have. Your stylist knows what your hair can do. | AI nereti parāda biezākus matus vai pilnīgāku matu augšanas līniju, nekā tev ir. Tavs stilists zina, ko ar taviem matiem patiesībā var panākt. | 8892f20d |  |
| tryOn.next | See your pictures side by side | Skatīt bildes līdzās | 1252c5a7 |  |
| tryOn.board.empty | Your board is empty. Save the pictures your AI chat makes and add them on Try it on. | Tavs tēlu dēlis ir tukšs. Saglabā mākslīgā intelekta čatā izveidotās bildes un pievieno tās sadaļā «Pielaikot». | e5ddbb63 |  |
| tryOn.board.addPictures | Add pictures | Pievienot bildes | 1e7102ea |  |
| tryOn.board.tilesLabel | Your looks | Tavi tēli | 2ef0baf7 |  |
| tryOn.board.noPicture | No picture yet | Bildes vēl nav | e83dfa18 |  |
| tryOn.board.compareLabel | Your photo or the AI picture | Tavs foto vai mākslīgā intelekta bilde | 14651f9d |  |
| tryOn.board.compareHint | Slide left for more of the AI picture, right for more of your photo. | Velc pa kreisi, lai redzētu vairāk mākslīgā intelekta bildes, pa labi – lai redzētu vairāk sava foto. | 0de67b37 |  |
| tryOn.board.photoAlt | Your photo | Tavs foto | 70f597b7 |  |
| tryOn.board.hairOnly | Hair-only version | Tikai matu versija | 8dbc1c7c |  |
| tryOn.board.hairOnlyHint | Keeps your real skin and background, with the AI picture's hair colour. | Saglabā tavu dabisko sejas ādu un fonu, piešķirot mākslīgā intelekta bildes matu krāsu. | eb981123 |  |
| tryOn.board.hairOnlyBusy | Making the hair-only version | Veidojam tikai matu versiju | 16697abd |  |
| tryOn.board.hairOnlyOff | The hair-only version needs the hair outline of your photo, which is not ready on this device. | Tikai matu versijai ir nepieciešama matu kontūra no tava foto, kas šajā ierīcē vēl nav sagatavota. | 8a68092e |  |
| tryOn.board.hairOnlyNoHair | No hair was found in this AI picture, so there is no hair-only version of it. | Šajā mākslīgā intelekta bildē netika atrasti mati, tāpēc tikai matu versija nav pieejama. | 7e0ed8ec |  |
| tryOn.board.save | Save board | Saglabāt tēlu dēli | 3bbd889c |  |
| tryOn.board.saving | Making the board picture | Veidojam tēlu dēļa bildi | 30785d42 |  |
| tryOn.board.shared | Board shared. | Tēlu dēlis ir kopīgots. | aea66b91 |  |
| tryOn.board.downloaded | Board saved to your downloads. | Tēlu dēlis saglabāts tavās lejupielādēs. | fdc1779a |  |
| tryOn.board.saveFailed | The board picture could not be made in this browser. | Šajā pārlūkprogrammā neizdevās izveidot tēlu dēļa bildi. | 44fe9d63 |  |
| tryOn.board.feedback | Tell us how it went | Pastāsti, kā tev veicās | 3fc39ad2 |  |
| tryOn.board.feedbackHint | Opens a new issue on GitHub in a new tab. Nothing from this session goes with it: no photos and no answers. | Jaunā cilnē atver jaunu pieteikumu GitHub. Nekas no šīs sesijas netiek nosūtīts: ne foto, ne atbildes. | a1af7f1a |  |
| ideas.count.label | How many ideas? | Cik ideju? | dc74ea8c |  |
| ideas.count.fewer | Fewer | Mazāk | 2a246cca |  |
| ideas.count.more | More | Vairāk | d47d7cb0 |  |
| ideas.count.unit | ideas | idejas | 53d8ba90 |  |
| ideas.count.bothHint | Half are cuts and the rest colour looks; an odd number gives one more cut. | Puse ir griezumi un pārējie – krāsu tēli; nepāra skaita gadījumā būs par vienu griezumu vairāk. | 4e767bd2 |  |
| ideas.colours.legend | Colour in your results | Matu krāsa tavos rezultātos | 2b015098 |  |
| ideas.colours.hint | For every idea, prompt and card below. | Katrai idejai, uzvednei un kartītei zemāk. | 1e476106 |  |
| ideas.colours.modes.keep | Keep my colour | Saglabāt manu matu krāsu | 1b5f990a |  |
| ideas.colours.modes.one | One colour for all | Viena krāsa visiem | 06d0f498 |  |
| ideas.colours.modes.pick | Pick colours for me | Izvēlēties krāsas manā vietā | 35516d59 |  |
| ideas.colours.which | Which colour? | Kuru krāsu? | 79a3b66e |  |
| ideas.colours.noneFits | None of these colours fits what you told us, so your ideas stay in your own colour. | Neviena no šīm krāsām neatbilst tam, ko norādīji, tāpēc tavas idejas paliek tavā pašreizējā matu krāsā. | 419c970f |  |
| ideas.colours.referralKept | So your ideas stay in your own colour. | Tāpēc tavas idejas paliek tavā pašreizējā matu krāsā. | 1fdf4efc |  |
| ideas.colours.keep | Keep my colour | Saglabāt manu matu krāsu | 1b5f990a |  |
| ideas.sections.cut | Cuts | Griezumi | ff41a9e8 |  |
| ideas.sections.colour | Colours | Krāsas | 88f20221 |  |
| ideas.rank.ourPick | Our pick | Mūsu izvēle | 0969abbc |  |
| ideas.rank.alsoWorth | Also worth trying | Arī vērts izmēģināt | 9d21c491 |  |
| ideas.rank.yours | You added this | Tu to pievienoji | ebbf9e43 |  |
| ideas.because | Because… | Jo… | e28c2b0a |  |
| ideas.feasibility.today | Works with your hair today | Piemērots taviem matiem jau šodien | 1a3d0325 |  |
| ideas.feasibility.poorFit | Not the best match for your hair texture | Nav labākā izvēle tavai matu tekstūrai | 23223dc7 |  |
| ideas.feasibility.adaptingFor.texture | for your hair texture | tavai matu tekstūrai | fcb830a2 |  |
| ideas.feasibility.adaptingFor.density | for your hair density | tavam matu biezumam | 85d931f4 |  |
| ideas.nouns.hair.texture | hair texture | matu tekstūra | bd805b91 |  |
| ideas.nouns.hair.current_length | current length | pašreizējais garums | 27ea8901 |  |
| ideas.nouns.hair.density | hair density | matu biezums | e12515a4 |  |
| ideas.nouns.hair.strand | strand thickness | mata biezums | 375e36da |  |
| ideas.nouns.hair.condition | hair condition | matu stāvoklis | 95860787 |  |
| ideas.nouns.hair.chemical_history | colour history | krāsošanas vēsture | 11d10cf8 |  |
| ideas.nouns.colour.natural_level | natural colour level | dabīgais toņa līmenis | 43fb03cb |  |
| ideas.nouns.colour.current_level_lengths | colour level at the lengths | toņa līmenis matu garumā | 9c72d96e |  |
| ideas.nouns.colour.current_tone | hair tone today | matu tonis šobrīd | a7dba7b9 |  |
| ideas.nouns.look.undertone | undertone | apakštonis | 51ea9c92 |  |
| ideas.nouns.pref.colour_upkeep | colour upkeep | krāsas uzturēšana | 18070148 |  |
| ideas.nouns.pref.fringe | fringe choice | priekšmatu izvēle | cba8dda7 |  |
| ideas.nouns.life.styling_minutes | styling time | ieveidošanas laiks | b4f1cb8b |  |
| ideas.closeQuestion | Done | Gatavs | 11a6767d |  |
| ideas.answersUpdated | Your ideas are up to date. | Tavas idejas ir atjauninātas. | 8f8684d8 |  |
| ideas.excluded | This does not fit what you told us: | Šis neatbilst tam, ko mums pastāstīji: | 72755701 |  |
| ideas.excludedKeep | It stays on your list unless you remove it. | Tas paliks tavā sarakstā, ja vien to neizņemsi. | 31eb41b5 |  |
| ideas.beforeAnyColour | Before any colour | Pirms krāsošanas | d2f5731c |  |
| ideas.moreAboutLook | More | Vairāk | d47d7cb0 |  |
| ideas.detailsLoading | Getting the details ready | Sagatavojam detaļas | 10ecb95b |  |
| ideas.detailsFailed | The details of this idea could not load. Reloading the page usually brings them back. | Neizdevās ielādēt šīs idejas detaļas. Parasti palīdz lapas pārlādēšana. | 974b8e5d |  |
| ideas.seeItOnMe | See it on me | Pielaiko sev | b6693711 |  |
| ideas.remove | Remove | Noņemt | c3812fc4 |  |
| ideas.moveEarlier | Move earlier | Pārvietot atpakaļ | 736612d4 |  |
| ideas.moveLater | Move later | Pārvietot tālāk | d6e85608 |  |
| ideas.addFromExplore | Add from Explore | Pievienot no «Atklāj» | 7d4cab8b |  |
| ideas.listFull | Your list holds 8 ideas, the most it can. Remove one to add this. | Tavā sarakstā ir 8 idejas — tas ir maksimālais skaits. Noņem kādu, lai pievienotu šo. | ce4664ba |  |
| ideas.together.open | Pair a cut with a colour | Apvieno griezumu ar krāsu | 84ebbd73 |  |
| ideas.together.title | Pair a cut with a colour | Apvieno griezumu ar krāsu | 84ebbd73 |  |
| ideas.together.hint | Pick one cut and one colour look to try as one picture. | Izvēlies vienu griezumu un vienu krāsojumu, lai izmēģinātu tos vienā attēlā. | 6858e201 |  |
| ideas.together.cut | Cut | Griezums | 1f45f025 |  |
| ideas.together.colour | Colour | Matu krāsa | 3a9dfa58 |  |
| ideas.together.set | Try these together | Izmēģini kopā | 813a70a5 |  |
| ideas.together.change | Change | Mainīt | c0bf75bd |  |
| ideas.together.remove | Remove | Noņemt | c3812fc4 |  |
| ideas.together.saved | Pair saved. It comes first on Try it on. | Kombinācija saglabāta. Tā būs pirmā sadaļā «Pielaiko». | 841f9c2d |  |
| ideas.together.removed | Pair removed. | Kombinācija noņemta. | a3381998 |  |
| ideas.improve.open | Improve my ideas | Uzlabot manas idejas | 76c4b5e6 |  |
| ideas.improve.title | Improve my ideas | Uzlabot manas idejas | 76c4b5e6 |  |
| ideas.improve.hint | Optional questions. Your ideas update as you answer. | Papildu jautājumi. Tavas idejas atjaunosies līdz ar atbildēm. | 662cbf75 |  |
| ideas.improve.none | There are no more questions for what you chose. | Tavai izvēlei vairāk jautājumu nav. | 6622d7ae |  |
| ideas.improve.showAll | Show all | Rādīt visu | 2150d8df |  |
| ideas.shortfall.answers | What you told us rules these out: | Tavas atbildes izslēdz šos variantus: | ed62730d |  |
| ideas.shortfall.unmet | No idea here can do what you asked: | Neviena no šīm idejām neatbilst tam, ko vēlējies: | 69fddbf2 |  |
| ideas.shortfall.kinds.cut | cuts | griezumi | 577aeee7 |  |
| ideas.shortfall.kinds.colour | colour looks | krāsojumi | 85cbede9 |  |
| ideas.aiPick.hint | Copy the prompt, then paste it into ChatGPT or Gemini with your photo. | Nokopē uzvedni, pēc tam ielīmē to ChatGPT vai Gemini kopā ar savu fotoattēlu. | d71b35ec |  |
| ideas.aiPick.copied | Prompt copied | Uzvedne nokopēta | c5539477 |  |
| ideas.aiPick.copiedLive | Prompt copied. Now open ChatGPT or Gemini, add your photo and paste it. | Uzvedne nokopēta. Tagad atver ChatGPT vai Gemini, pievieno savu fotoattēlu un ielīmē uzvedni. | f9ebf045 |  |
| ideas.aiPick.refused | This browser did not allow copying. The prompt is selected in the box below: copy it from there. | Šī pārlūkprogramma neļāva nokopēt. Uzvedne ir iezīmēta lodziņā zemāk — nokopē to no turienes. | 588d7be7 |  |
| ideas.aiPick.selectAll | Select all | Atlasīt visu | 1fc9a387 |  |
| ideas.aiPick.promptLabel | The prompt | Uzvedne | b62c640b |  |
| ideas.faceCard | See my face card | Apskatīt manu sejas kartīti | 0ede555f |  |
| ideas.worthAsking.title | Worth asking a colourist about | Vērts pajautāt koloristam | dda78b6c |  |
| ideas.worthAsking.intro | These are not full matches for what you asked. A colourist can tell you whether they would work for you. | Šie varianti pilnībā neatbilst tam, ko vēlējies, taču kolorists var pateikt, vai tie tev derētu. | 4326b512 |  |
| ideas.worthAsking.why.salon_look | This colour is from Women's styles, pictured on longer hair. It is one colour all over, so ask a colourist how it would look on your hair. | Šī krāsa ir no sadaļas «Sieviešu griezumi», attēlā redzama garākos matos. Tas ir vienots tonis visā garumā, tāpēc pajautā koloristam, kā tas izskatītos tavos matos. | 2288218a |  |
| ideas.worthAsking.add | Add to my ideas | Pievienot manām idejām | 61f67098 |  |
| ideas.addPhoto | Add a photo | Pievienot fotoattēlu | c3342da7 |  |
| ideas.addAnother | Add another photo | Pievienot vēl vienu fotoattēlu | fef05d42 |  |
| ideas.next | Try them on | Pielaiko | 577799f6 |  |
| face.next | Choose what to change | Izvēlies, ko mainīt | 13521e09 |  |
| face.backToIdeas | Back to my ideas | Atpakaļ pie manām idejām | 802ab298 |  |
| face.reading | Reading your photo. | Nolasām tavu fotoattēlu. | f3465c07 |  |
| face.wait | You can go on. Your card will wait for you. | Vari turpināt. Tava kartīte tevi pagaidīs. | 56fbcf08 |  |
| face.noneRead | None of your photos could be read, so your ideas will come from your answers. | Nevienu no taviem fotoattēliem neizdevās nolasīt, tāpēc idejas piemeklēsim pēc tavām atbildēm. | b054e976 |  |
| face.chooseAnother | Choose another photo | Izvēlies citu fotoattēlu | 69dd56f0 |  |
| face.addAnother | Add another photo | Pievienot vēl vienu fotoattēlu | fef05d42 |  |
| face.save.button | Save my face card | Saglabāt manu sejas kartīti | 9a54de8c |  |
| face.save.saving | Making your face card | Top tava sejas kartīte | b19b3821 |  |
| face.save.shareTitle | My face card | Mana sejas kartīte | 2251a00b |  |
| face.save.shared | Face card shared. | Sejas kartīte kopīgota. | 2beacfa4 |  |
| face.save.downloaded | Face card saved to your downloads. | Sejas kartīte saglabāta lejupielādēs. | 3377ca88 |  |
| face.save.failed | The face card could not be made in this browser. | Šajā pārlūkprogrammā neizdevās izveidot sejas kartīti. | 6bdf4252 |  |
| face.more.heading | More with your photo | Vairāk iespēju ar tavu fotoattēlu | f82704f0 |  |
| face.more.refine | Refine my hair outline | Precizēt matu kontūru | 1553fd9a |  |
| face.more.threeD | See it in 3D | Skatīt 3D | b8060d34 |  |
| face.more.blocked.computer_only | Available on a computer | Pieejams datorā | c2a69544 |  |
| face.more.blocked.no_webgl2 | 3D view needs WebGL, which this browser has turned off. Your face card is ready without it. | 3D skatam nepieciešams WebGL, kas šajā pārlūkprogrammā ir izslēgts. Tava sejas kartīte ir gatava arī bez tā. | e50b3cae |  |
| face.more.blocked.low_memory | The 3D view needs more memory than this device has. Your face card is ready without it. | 3D skatam nepieciešams vairāk atmiņas, nekā ir šai ierīcei. Tava sejas kartīte ir gatava arī bez tā. | 1a5d6795 |  |
| face.more.blocked.crashed_last_time | This tool stopped the page last time, so it is off for now on this device. | Iepriekšējā reizē šis rīks apturēja lapas darbību, tāpēc šajā ierīcē tas pagaidām ir izslēgts. | 4b02cc97 |  |
| face.more.blocked.out_of_memory | This device ran out of memory twice, so this tool is off until you start again. | Šai ierīcei divreiz beidzās atmiņa, tāpēc šis rīks ir izslēgts, līdz sāksi no jauna. | 2c9a2d05 |  |
| face.extra.downloading | Getting this tool ready. First time only. | Sagatavojam šo rīku. Tikai pirmajā reizē. | 3c34016e |  |
| face.extra.threeDName | 3D view of your photo, for looking only, not for measuring. | Tava fotoattēla 3D skats — tikai apskatei, nevis mērījumiem. | 35c22d6b |  |
| face.explain.button | Copy a prompt to explain my face card | Kopēt uzvedni sejas kartītes skaidrojumam | 91411101 |  |
| face.explain.hint | Paste it into ChatGPT or Gemini. The app does not read the answer. | Ielīmē to ChatGPT vai Gemini. Lietotne atbildi nelasa. | bfe51332 |  |
| face.explain.copied | Prompt copied | Uzvedne nokopēta | c5539477 |  |
| face.explain.copiedLive | Prompt copied. Now open ChatGPT or Gemini and paste it. | Uzvedne nokopēta. Tagad atver ChatGPT vai Gemini un ielīmē to. | c4c66d52 |  |
| face.explain.refused | This browser did not allow copying. The prompt is selected in the box below: copy it from there. | Šī pārlūkprogramma neļāva nokopēt. Uzvedne ir iezīmēta lodziņā zemāk — nokopē to no turienes. | 588d7be7 |  |
| face.explain.box | The prompt | Uzvedne | b62c640b |  |
| face.explain.selectAll | Select all | Atlasīt visu | 1fc9a387 |  |
| face.colour.heading | Colour hints | Krāsu norādes | ebddbeb4 |  |
| face.colour.intro | Read from your photo in its own light, so they are hints only. | Noteiktas pēc tava fotoattēla esošajā apgaismojumā, tāpēc tās ir tikai norādes. | dae75ac2 |  |
| face.mover.ask | Do the lines sit in the wrong place? | Vai līnijas nav īstajā vietā? | 6c6c5866 |  |
| face.mover.open | Move the lines | Pārvietot līnijas | 444a8220 |  |
| face.mover.intro | Drag a dot to the right place, or pick a part and use the arrows. Left and right are as you see the photo. Your facts update as you go. | Pārvelc punktu uz īsto vietu vai izvēlies sejas daļu un izmanto bultiņas. Kreisā un labā puse ir tā, kā redzi fotoattēlā. Dati atjaunojas darba gaitā. | 50c33ff5 |  |
| face.mover.canvas | Your photo with its lines and a dot on each part you can move | Tavs fotoattēls ar līnijām un punktu uz katras daļas, ko vari pārvietot | 6d4b284d |  |
| face.mover.partLegend | Part to move | Pārvietojamā daļa | d9387d30 |  |
| face.mover.parts.hairline | Hairline | Matu augšanas līnija | 561676af |  |
| face.mover.parts.chin | Chin | Zods | 0f9aa8a1 |  |
| face.mover.parts.cheek_left | Left cheek | Kreisais vaigs | 85c9e62b |  |
| face.mover.parts.cheek_right | Right cheek | Labais vaigs | 058e3b84 |  |
| face.mover.parts.jaw_left | Left jaw | Kreisais žoklis | 06359f47 |  |
| face.mover.parts.jaw_right | Right jaw | Labais žoklis | 9a33b267 |  |
| face.mover.nudge.up | Up | Uz augšu | 55490a4b |  |
| face.mover.nudge.down | Down | Uz leju | b86d11af |  |
| face.mover.nudge.left | Left | Pa kreisi | 58eb9032 |  |
| face.mover.nudge.right | Right | Pa labi | 883361d5 |  |
| face.mover.putAllBack | Put all the lines back as found | Atgriezt visas līnijas, kā bija | 45f67c1c |  |
| face.mover.allBackDone | All the lines are back where they were found. | Visas līnijas ir atgrieztas, kā bija. | f355812b |  |
| face.mover.done | Done | Gatavs | 11a6767d |  |
| extras.notReady | This tool is not available yet. | Šis rīks vēl nav pieejams. | f1674c8c |  |
| extras.preview.label | Rough preview | Aptuvens priekšskatījums | 8aa39e33 |  |
| extras.preview.placed | Your colourist places the highlights | Tavs kolorists izvieto šķipsnas | ca9c5c4c |  |
| extras.preview.busy | Putting this colour on your hair | Ieklājam šo krāsu tavos matos | a8a99aff |  |
| extras.preview.familyLabel | Colour family | Krāsu gamma | 7506113e |  |
| extras.preview.looksLabel | Colour looks | Krāsojumi | 1e3eace5 |  |
| extras.preview.noLooks | No colour looks are ready to show yet. | Pagaidām nav krāsojumu, ko parādīt. | a1ab4cb3 |  |
| extras.preview.notShowable | This look is placed by hand, so the rough preview cannot show it. Your colourist can show you how it would sit. | Šis krāsojums tiek veidots ar roku, tāpēc aptuvenajā priekšskatījumā to nevar parādīt. Tavs kolorists varēs parādīt, kā tas izskatīsies. | e40867ee |  |
| extras.preview.neutral | Neutral grey view | Neitrāli pelēks skats | 5dbdfe4c |  |
| extras.preview.neutralHint | A plain grey surround, the way colourists judge colour. | Vienmērīgi pelēks fons — tā, kā krāsu vērtē koloristi. | 44cdb84a |  |
| extras.preview.compare | Before and after | Pirms un pēc | d542f991 |  |
| extras.preview.noBefore | Your own photo could not be shown here, so there is nothing to compare this with. | Tavu fotoattēlu šeit neizdevās parādīt, tāpēc nav ar ko salīdzināt. | ebd1b4eb |  |
| extras.preview.compareHint | Slide towards the right to see more of your own photo. | Bīdi pa labi, lai vairāk redzētu savu fotoattēlu. | 8036f0c8 |  |
| extras.preview.failed | The preview could not be made. | Neizdevās izveidot priekšskatījumu. | 506ae869 |  |
| extras.preview.tryAgain | Try again | Mēģināt vēlreiz | d8b8392e |  |
| extras.refine.open | Tap your hair to make the preview fit better | Pieskaries matiem, lai pielāgotu priekšskatījumu | a2b2fe57 |  |
| extras.refine.back | Back to the preview | Atpakaļ uz priekšskatījumu | fe241645 |  |
| extras.refine.computerOnly | Tapping your hair to fit the preview is available on a computer. | Pielāgot priekšskatījumu, pieskaroties matiem, vari datorā. | f1d04e62 |  |
| extras.tap.intro | Tap your hair to add it to the outline, or choose Not hair and tap what should come out. | Pieskaries matiem, lai pievienotu tos kontūrai, vai izvēlies «Nav mati» un pieskaries tam, ko vēlies noņemt. | dd28fdef |  |
| extras.tap.photo | Your photo with the hair outline. Use the buttons below to mark a spot without tapping. | Tavs fotoattēls ar matu kontūru. Izmanto pogas zemāk, lai atzīmētu punktu bez pieskāriena. | e3ab1450 |  |
| extras.tap.add | Hair | Mati | ababed48 |  |
| extras.tap.remove | Not hair | Nav mati | 6c5e66d1 |  |
| extras.tap.modeLabel | What a tap marks | Ko atzīmē pieskāriens | 19b12e00 |  |
| extras.tap.move.up | Up | Uz augšu | 55490a4b |  |
| extras.tap.move.down | Down | Uz leju | b86d11af |  |
| extras.tap.move.left | Left | Pa kreisi | 58eb9032 |  |
| extras.tap.move.right | Right | Pa labi | 883361d5 |  |
| extras.tap.moveLabel | Move the spot | Pārvietot punktu | c2f81fa2 |  |
| extras.tap.mark | Mark this spot | Atzīmēt šo punktu | c341c92b |  |
| extras.tap.busy | Reading your tap. The first one takes a few seconds. | Apstrādājam pieskārienu. Pirmajā reizē tas aizņem dažas sekundes. | 43f1ad0e |  |
| extras.tap.updated | Hair outline updated. | Matu kontūra atjaunināta. | cc64c0af |  |
| extras.tap.failed | That tap could not be read. Try again. | Šo pieskārienu neizdevās nolasīt. Mēģini vēlreiz. | ba7a4e0b |  |
| extras.tap.use | Use this outline | Izmantot šo kontūru | 0a489671 |  |
| extras.tap.reset | Start over | Sākt no jauna | 5eed7e9f |  |
| extras.gate.failed | This tool could not load. Everything else keeps working without it. | Šo rīku neizdevās ielādēt. Viss pārējais turpina darboties arī bez tā. | 2f874dd7 |  |
| extras.threeD.busy | Working out the depth of your photo | Nosakām tava fotoattēla dziļumu | 0ca31f04 |  |
| extras.threeD.stage | Your photo in 3D | Tavs fotoattēls 3D | 4fe63a72 |  |
| extras.threeD.left | Turn left | Pagriezt pa kreisi | 1aa12f92 |  |
| extras.threeD.right | Turn right | Pagriezt pa labi | f00ba3f3 |  |
| extras.threeD.up | Tilt up | Sasvērt uz augšu | 453c4235 |  |
| extras.threeD.down | Tilt down | Sasvērt uz leju | 5c6d1460 |  |
| extras.threeD.reset | Reset | Atiestatīt | daee7606 |  |
| extras.threeD.controls | Move the view | Pārvietot skatu | c8ab51d4 |  |
| extras.threeD.failed | The 3D view could not open in this browser. Your face card is ready without it. | Šajā pārlūkprogrammā neizdevās atvērt 3D skatu. Tava sejas karte ir gatava arī bez tā. | 42465263 |  |
| extras.threeD.lost | The 3D view stopped. Close this sheet to start again. | 3D skats pārstāja darboties. Aizver šo logu, lai sāktu no jauna. | cfb1223e |  |
| language.legend | Language | Valoda | a4fe6526 |  |
| language.failed | The Latvian text could not load, so the app is in English for now. Reload the page to try again. | Neizdevās ielādēt tekstu latviešu valodā, tāpēc lietotne pagaidām ir angliski. Pārlādē lapu, lai mēģinātu vēlreiz. | 301cc481 |  |
| language.safetyInEnglish | Some safety texts are still shown in English. | Daļa drošības informācijas joprojām ir angļu valodā. | 41f8325c |  |
| copy.footer.app | Huecut | Huecut | 7c2e4547 | same |
| copy.faceCard.heading | What this photo shows | Ko parāda šis fotoattēls | 4ba0bf40 |  |
| copy.faceCard.footerNote | Estimates from your photo, made on your device. | Aptuvens novērtējums pēc tava fotoattēla, veikts tavā ierīcē. | f9ba8703 |  |
| copy.faceCard.closeUpLine | Taken close up, so these are approximate (close-up photo). | Uzņemts tuvplānā, tāpēc rādītāji ir aptuveni (tuvplāna fotoattēls). | f6df7eee |  |
| copy.faceCard.lines.face_outline | Face outline | Sejas ovāls | fa085ce6 |  |
| copy.faceCard.lines.hairline | Hairline | Matu augšanas līnija | 561676af |  |
| copy.faceCard.lines.brows | Brows | Uzacis | 4c1eb4c7 |  |
| copy.faceCard.lines.eye_line | Eye line | Acu līnija | dfcf95ba |  |
| copy.faceCard.lines.nose_width | Nose width | Deguna platums | de71cd4f |  |
| copy.faceCard.lines.lip_line | Lip line | Lūpu līnija | cd365a96 |  |
| copy.faceCard.lines.jaw | Jaw | Žoklis | b27dd491 |  |
| copy.faceCard.lines.chin | Chin | Zods | 0f9aa8a1 |  |
| copy.faceCard.sureness.steady | steady estimate | drošs novērtējums | 417b3620 |  |
| copy.faceCard.sureness.estimate | estimate | novērtējums | 79e1d925 |  |
| copy.faceCard.sureness.rough | rough estimate | aptuvens novērtējums | 9097a82d |  |
| copy.faceCard.cannotRead | cannot read reliably | nevar ticami nolasīt | 6c1f0a1c |  |
| copy.faceCard.months.0 | January | Janvāris | 37082e68 |  |
| copy.faceCard.months.1 | February | Februāris | c877c6ff |  |
| copy.faceCard.months.2 | March | Marts | 9d95a2cf |  |
| copy.faceCard.months.3 | April | Aprīlis | 4afe6ea1 |  |
| copy.faceCard.months.4 | May | Maijs | 8c78fe5b |  |
| copy.faceCard.months.5 | June | Jūnijs | d5808c0e |  |
| copy.faceCard.months.6 | July | Jūlijs | e9cf7a1c |  |
| copy.faceCard.months.7 | August | Augusts | a66d8970 |  |
| copy.faceCard.months.8 | September | Septembris | cd559ea0 |  |
| copy.faceCard.months.9 | October | Oktobris | fdd79178 |  |
| copy.faceCard.months.10 | November | Novembris | 9de6fe1d |  |
| copy.faceCard.months.11 | December | Decembris | 8fb204ca |  |
| copy.faceNotes.face.proportion.name | Length and width | Garums un platums | 2138b01f |  |
| copy.faceNotes.face.proportion.values.longer.words | clearly longer than it is wide | izteikti garāka nekā plata | 009b3d78 |  |
| copy.faceNotes.face.proportion.values.longer.hair | Volume at the sides makes a face look wider. | Apjoms sānos vizuāli paplašina seju. | 53639373 |  |
| copy.faceNotes.face.proportion.values.balanced.words | a little longer than it is wide | nedaudz garāka nekā plata | b9a72dbe |  |
| copy.faceNotes.face.proportion.values.balanced.hair | Height on top makes a face look longer, and volume at the sides makes it look wider. | Pacēlums virspusē vizuāli pagarina seju, bet apjoms sānos to paplašina. | afd4f113 |  |
| copy.faceNotes.face.proportion.values.rounder.words | nearly as wide as it is long | gandrīz tikpat plata, cik gara | 179a84de |  |
| copy.faceNotes.face.proportion.values.rounder.hair | Height on top makes a face look longer. | Pacēlums virspusē vizuāli pagarina seju. | 18e43f67 |  |
| copy.faceNotes.face.forehead_share.name | Forehead | Piere | 38ac6399 |  |
| copy.faceNotes.face.forehead_share.values.longer.words | longer than the other two sections | garāka par pārējām divām daļām | d7eb0fcd |  |
| copy.faceNotes.face.forehead_share.values.longer.hair | A fringe makes a forehead look shorter. | Priekšmati vizuāli saīsina pieri. | c8f2943d |  |
| copy.faceNotes.face.forehead_share.values.similar.words | about the same as the other two sections | aptuveni vienāda ar pārējām divām daļām | db50d427 |  |
| copy.faceNotes.face.forehead_share.values.similar.hair | A fringe covers part of the forehead, and an open front shows all of it. | Priekšmati nosedz daļu pieres, bet atsegti mati priekšpusē to parāda pilnībā. | cb301930 |  |
| copy.faceNotes.face.forehead_share.values.shorter.words | shorter than the other two sections | īsāka par pārējām divām daļām | 75da2dc9 |  |
| copy.faceNotes.face.forehead_share.values.shorter.hair | An open front shows all of the forehead. | Atsegti mati priekšpusē parāda visu pieri. | ce9e7e80 |  |
| copy.faceNotes.face.lower_share.name | Nose to chin | No deguna līdz zodam | cb715699 |  |
| copy.faceNotes.face.lower_share.values.longer.words | longer than the other two sections | garāka par pārējām divām daļām | d7eb0fcd |  |
| copy.faceNotes.face.lower_share.values.longer.hair | Volume at the jaw makes the lower face look wider. | Apjoms žokļa zonā vizuāli paplašina sejas apakšdaļu. | 0f4c76ce |  |
| copy.faceNotes.face.lower_share.values.similar.words | about the same as the other two sections | aptuveni vienāda ar pārējām divām daļām | db50d427 |  |
| copy.faceNotes.face.lower_share.values.similar.hair | Where the hair ends draws the eye to that height. | Vieta, kur beidzas mati, piesaista skatienu tieši šim līmenim. | 346240c0 |  |
| copy.faceNotes.face.lower_share.values.shorter.words | shorter than the other two sections | īsāka par pārējām divām daļām | 75da2dc9 |  |
| copy.faceNotes.face.lower_share.values.shorter.hair | Length past the chin draws the eye down. | Matu garums zem zoda vērš skatienu uz leju. | cfbd6e9a |  |
| copy.faceNotes.face.jaw_vs_cheek.name | Jaw | Žoklis | b27dd491 |  |
| copy.faceNotes.face.jaw_vs_cheek.values.narrower.words | clearly narrower than the cheekbones | izteikti šaurāks par vaigu kauliem | 7fd42cd6 |  |
| copy.faceNotes.face.jaw_vs_cheek.values.narrower.hair | Fullness at the jaw line makes the jaw look wider. | Matu apjoms žokļa līnijā vizuāli paplašina žokli. | 1d73afb4 |  |
| copy.faceNotes.face.jaw_vs_cheek.values.similar.words | a little narrower than the cheekbones | nedaudz šaurāks par vaigu kauliem | 8b42c668 |  |
| copy.faceNotes.face.jaw_vs_cheek.values.similar.hair | Soft layers blur the jaw line, and blunt ends mark it. | Maigas pakāpes mīkstina žokļa līniju, bet taisni gali to izceļ. | e2a02538 |  |
| copy.faceNotes.face.jaw_vs_cheek.values.wider.words | about as wide as the cheekbones | aptuveni tikpat plats, cik vaigu kauli | e9a588a3 |  |
| copy.faceNotes.face.jaw_vs_cheek.values.wider.hair | Height on top and softness at the cheekbones draw the eye up. | Pacēlums virspusē un maigas līnijas pie vaigu kauliem vērš skatienu uz augšu. | 7da3bbdd |  |
| copy.facts.hair.texture.label | Texture | Tekstūra | e28411a3 |  |
| copy.facts.hair.texture.values.straight | straight | taisni | 2a424875 |  |
| copy.facts.hair.texture.values.wavy | wavy | viļņaini | 398a882c |  |
| copy.facts.hair.texture.values.curly | curly | cirtaini | 6307fe49 |  |
| copy.facts.hair.texture.values.coily | coily | sīki cirtaini | d3210caa |  |
| copy.facts.hair.texture.values.mixed | mixed, wavy and curly | jaukti — viļņaini un cirtaini | 7d047482 |  |
| copy.facts.hair.density.label | Density | Blīvums | 77a283d6 |  |
| copy.facts.hair.density.values.low | low | zems | 6c1ff09d |  |
| copy.facts.hair.density.values.medium | medium | vidējs | c082456a |  |
| copy.facts.hair.density.values.high | high | augsts | 6ef7c9b1 |  |
| copy.facts.hair.strand.label | Strand | Mata stiebrs | 770baae2 |  |
| copy.facts.hair.strand.values.fine | fine | smalks | d14a58ba |  |
| copy.facts.hair.strand.values.medium | medium | vidējs | c082456a |  |
| copy.facts.hair.strand.values.coarse | coarse | biezs | 152397e3 |  |
| copy.facts.hair.current_length.label | Current length | Pašreizējais garums | 6eefee6b |  |
| copy.facts.hair.current_length.values.very_short | very short | ļoti īsi | 04682903 |  |
| copy.facts.hair.current_length.values.short | short | īsi | f9b0078b |  |
| copy.facts.hair.current_length.values.chin | to the chin | līdz zodam | 3f5bdde5 |  |
| copy.facts.hair.current_length.values.shoulder | to the shoulders | līdz pleciem | 9e017a99 |  |
| copy.facts.hair.current_length.values.long | long | gari | fc66f021 |  |
| copy.facts.hair.current_length.values.very_long | very long | ļoti gari | ed6895c5 |  |
| copy.facts.colour.natural_level.label | Natural level | Dabīgais toņa līmenis | 2feffc92 |  |
| copy.facts.hair.chemical_history.label | Colour history, last 2-3 years | Krāsošanas vēsture pēdējos 2–3 gados | 2c2a816b |  |
| copy.facts.hair.chemical_history.none | none of these | neviens no šiem | e0bd4ba4 |  |
| copy.facts.hair.chemical_history.values.none | none | nekas | 140bedbf |  |
| copy.facts.hair.chemical_history.values.home_dye | home dye | mājas matu krāsa | c35f2f23 |  |
| copy.facts.hair.chemical_history.values.home_dark_dye | dark home dye | tumša mājas matu krāsa | cd06bf87 |  |
| copy.facts.hair.chemical_history.values.salon_colour | salon colour | salona matu krāsa | 422d8fba |  |
| copy.facts.hair.chemical_history.values.bleach | bleach | balinātājs | 2cde8d18 |  |
| copy.facts.hair.chemical_history.values.highlights | highlights | šķipsnas | 8bae09e7 |  |
| copy.facts.hair.chemical_history.values.vivid | vivid colours | košie toņi | e8f16b69 |  |
| copy.facts.hair.chemical_history.values.colour_remover | colour remover | krāsas noņēmējs | 6b892c63 |  |
| copy.facts.hair.chemical_history.values.henna_plant | plant henna | augu henna | 3c300872 |  |
| copy.facts.hair.chemical_history.values.henna_compound | compound henna | henna ar piejaukumiem | 639bc0b3 |  |
| copy.facts.hair.chemical_history.values.relaxer_perm | relaxer or perm | ķīmiskā taisnošana vai ilgviļņi | c374512f |  |
| copy.facts.hair.chemical_history.values.keratin | keratin treatment | keratīna procedūra | 5d444c63 |  |
| copy.facts.colour.current_level_lengths.label | Current level at the lengths | Pašreizējais toņa līmenis matu garumā | 973c75e4 |  |
| copy.facts.colour.last_dye.label | Last dye | Pēdējā krāsošana | 88de012e |  |
| copy.facts.colour.last_dye.values.weeks_0_2 | in the last 2 weeks | pēdējo 2 nedēļu laikā | fa16fe83 |  |
| copy.facts.colour.last_dye.values.weeks_2_8 | 2-8 weeks ago | Pirms 2–8 nedēļām | 82f83bb0 |  |
| copy.facts.colour.last_dye.values.months_2_6 | 2-6 months ago | Pirms 2–6 mēnešiem | 3d7b5e5b |  |
| copy.facts.colour.last_dye.values.months_6_plus | more than 6 months ago | pirms vairāk nekā 6 mēnešiem | 3ecd23f5 |  |
| copy.facts.colour.last_dye.values.never | never | nekad | 6497e4b3 |  |
| copy.facts.colour.last_chemical_service.label | Last chemical service | Pēdējā ķīmiskā procedūra | 98cd18c5 |  |
| copy.facts.colour.last_chemical_service.values.weeks_0_2 | in the last 2 weeks | pēdējo 2 nedēļu laikā | fa16fe83 |  |
| copy.facts.colour.last_chemical_service.values.weeks_2_8 | 2-8 weeks ago | Pirms 2–8 nedēļām | 82f83bb0 |  |
| copy.facts.colour.last_chemical_service.values.months_2_6 | 2-6 months ago | Pirms 2–6 mēnešiem | 3d7b5e5b |  |
| copy.facts.colour.last_chemical_service.values.months_6_plus | more than 6 months ago | pirms vairāk nekā 6 mēnešiem | 3ecd23f5 |  |
| copy.facts.colour.last_chemical_service.values.never | never | nekad | 6497e4b3 |  |
| copy.facts.colour.bleach_count.label | Times bleached | Balināšanas reižu skaits | ab3fa51d |  |
| copy.facts.colour.grey_percent.label | Grey | Sirmo matu daudzums | d4ac5809 |  |
| copy.facts.colour.grey_texture.label | Grey texture | Sirmo matu tekstūra | bb00fd18 |  |
| copy.facts.colour.grey_texture.values.same | same as the rest | tāda pati kā pārējiem | 3ddc7ca7 |  |
| copy.facts.colour.grey_texture.values.wiry | wiry | raupja | fc13fda7 |  |
| copy.facts.colour.grey_texture.values.dry | dry | sausa | b755cb24 |  |
| copy.sheet.headings.lengths | Lengths | Garumi | 61af5be9 |  |
| copy.sheet.headings.fade | Fade | Fade | 9efb597c | same |
| copy.sheet.headings.fringe | Fringe | Priekšmati | 7684d4b1 |  |
| copy.sheet.headings.layers | Layers | Pakāpes | 0bcd66e6 |  |
| copy.sheet.headings.yourHair | For my hair | Maniem matiem | 4a92213a |  |
| copy.sheet.headings.upkeep | Upkeep | Uzturēšana | 7671224c |  |
| copy.sheet.headings.stylist | For the stylist | Stilistam | b31a2edc |  |
| copy.sheet.headings.growOut | Growing it out | Ataudzēšana | 0713c8e6 |  |
| copy.sheet.headings.colour | Colour | Matu krāsa | 3a9dfa58 |  |
| copy.sheet.headings.journey | Before you book | Pirms pieraksties | aaeaabe5 |  |
| copy.sheet.headings.colourist | For the colourist | Koloristam | a7214c52 |  |
| copy.sheet.headings.aboutMyHair | About my hair | Par maniem matiem | 406cb87c |  |
| copy.sheet.zones.top | Top | Augšpuse | d5cdfcf7 |  |
| copy.sheet.zones.fringe | Fringe | Priekšmati | 7684d4b1 |  |
| copy.sheet.zones.sides | Sides | Sāni | 1c3607d5 |  |
| copy.sheet.zones.back | Back | Aizmugure | 76900f1b |  |
| copy.sheet.zones.nape | Nape | Pakausis | 1b56cb12 |  |
| copy.sheet.zones.perimeter | Length | Garums | adc95605 |  |
| copy.sheet.zones.basis | Measured | Mērīts | 9298c8f4 |  |
| copy.sheet.basisNote | dry and stretched | sausi un izstiepti | 1b805ad7 |  |
| copy.sheet.landmarks.above_ear | above the ear | virs auss | 56d4b6ec |  |
| copy.sheet.landmarks.ear | at the ear | līdz ausij | cb540661 |  |
| copy.sheet.landmarks.jaw | at the jaw | līdz žoklim | 6e3f1ac4 |  |
| copy.sheet.landmarks.chin | at the chin | līdz zodam | d9857567 |  |
| copy.sheet.landmarks.collarbone | at the collarbone | līdz atslēgas kaulam | 79644a20 |  |
| copy.sheet.landmarks.shoulder | at the shoulders | līdz pleciem | 36b3d049 |  |
| copy.sheet.landmarks.shoulder_blade | to the shoulder blades | līdz lāpstiņām | 1349cfeb |  |
| copy.sheet.landmarks.mid_back | to the middle of the back | līdz muguras vidum | 794fd0c4 |  |
| copy.sheet.landmarks.waist | to the waist | līdz viduklim | 804ca2be |  |
| copy.sheet.fringeLandmarks.brow | at the brow | līdz uzacīm | c91e92be |  |
| copy.sheet.fringeLandmarks.above_brow | just above the brow | nedaudz virs uzacīm | 90feed61 |  |
| copy.sheet.fringeLandmarks.lash | at the lashes | līdz skropstām | 8519850a |  |
| copy.sheet.fringeLandmarks.cheekbone | at the cheekbones | līdz vaigu kauliem | f118f8d6 |  |
| copy.sheet.fadeKinds.fade | fade | fade | 009978b8 | same |
| copy.sheet.fadeKinds.skin | skin fade | skin fade | 708c7e62 | same |
| copy.sheet.fadeKinds.bald | bald fade | bald fade | 02df20a1 | same |
| copy.sheet.fadeKinds.drop | drop fade | drop fade | e4356781 | same |
| copy.sheet.fadeKinds.taper | taper | taper | db29c78e | same |
| copy.sheet.fadeKinds.scissor_taper | scissor taper | scissor taper | c8dec1ec | same |
| copy.sheet.fadeKinds.undercut | undercut | undercut | bd200945 | same |
| copy.sheet.fadeHeights.low | Low | Zems | f793de20 |  |
| copy.sheet.fadeHeights.mid | Mid | Vidējs | 76df0c6d |  |
| copy.sheet.fadeHeights.high | High | Augsts | c4ebc6d4 |  |
| copy.sheet.necklines.natural | natural | dabiska | 12765295 |  |
| copy.sheet.necklines.tapered | tapered | iztušēta | 1aa7dabd |  |
| copy.sheet.necklines.blocked | blocked | taisna | 6973dddd |  |
| copy.sheet.necklines.rounded | rounded | noapaļota | 01024dee |  |
| copy.sheet.fringes.none | No fringe | Bez priekšmatiem | 5167f29b |  |
| copy.sheet.fringes.micro | Micro fringe | Mikro priekšmati | 581dc60f |  |
| copy.sheet.fringes.short_blunt | Short blunt fringe | Īsi, taisni priekšmati | 04143574 |  |
| copy.sheet.fringes.blunt_full | Full blunt fringe | Biezi, taisni priekšmati | ec78639e |  |
| copy.sheet.fringes.bottleneck | Bottleneck fringe | Bottleneck priekšmati | f0fb0c20 |  |
| copy.sheet.fringes.wispy | Wispy fringe | Gaisīgi priekšmati | 2540e284 |  |
| copy.sheet.fringes.curtain | Curtain fringe | Aizkarveida priekšmati | b9dfe39f |  |
| copy.sheet.fringes.side_swept | Side-swept fringe | Slīpie priekšmati | 547324dc |  |
| copy.sheet.fringes.long_side | Long side fringe | Gari slīpie priekšmati | 1ef45293 |  |
| copy.sheet.fringes.textured_forward | Textured fringe worn forward | Teksturēti priekšmati uz priekšu | d012288c |  |
| copy.sheet.fringes.curly | Curly fringe | Cirtaini priekšmati | 9c7f7871 |  |
| copy.sheet.layers.none | no layers | bez pakāpēm | 23e7375f |  |
| copy.sheet.layers.light | light layers | vieglas pakāpes | 0cef8ca2 |  |
| copy.sheet.layers.medium | medium layers | vidējas pakāpes | a9cc4e02 |  |
| copy.sheet.layers.heavy | heavy layers | izteiktas pakāpes | c9a38320 |  |
| copy.sheet.layers.internal | internal layers | iekšējās pakāpes | da4be124 |  |
| copy.sheet.layers.long_layers | long layers | garas pakāpes | 3b2d2915 |  |
| copy.sheet.layers.face_framing | face-framing layers | seju ierāmējošas pakāpes | 372c2d24 |  |
| copy.sheet.layers.shag | shag layers | shag pakāpes | 237e7a1b |  |
| copy.sheet.layers.chin_level | layers at the chin | pakāpes līdz zodam | 5fcb71fa |  |
| copy.sheet.fits.good | works as cut | der tāds, kā griezts | 13692ccb |  |
| copy.sheet.fits.adapt | needs adapting | jāpielāgo | 05881d25 |  |
| copy.sheet.fits.poor | a harder match | grūtāk pielāgojams | 7c9dc3d2 |  |
| copy.sheet.heat.none | no heat styling | bez karstajiem rīkiem | 724d7825 |  |
| copy.sheet.heat.rare | heat now and then | karstie rīki šad tad | 9cd66399 |  |
| copy.sheet.heat.weekly | heat about once a week | karstie rīki apmēram reizi nedēļā | 184d003d |  |
| copy.sheet.heat.daily | heat most days | karstie rīki gandrīz katru dienu | 08c41f0e |  |
| copy.sheet.regions.root | Root | Saknes | 44cb005e |  |
| copy.sheet.regions.mids | Mid-lengths | Matu vidusdaļa | b706a6eb |  |
| copy.sheet.regions.ends | Ends | Gali | e98982c9 |  |
| copy.sheet.regions.face_frame | Face-framing pieces | Seju ierāmējošās šķipsnas | f9658956 |  |
| copy.sheet.regions.highlights | Fine highlights | Smalkas gaišās šķipsnas | c6321430 |  |
| copy.sheet.regions.lowlights | Fine lowlights | Smalkas tumšās šķipsnas | 9b501561 |  |
| copy.sheet.journeyLabels.plausible | Plausible | Reālistiski | 1b0e4aaa | safety; checked |
| copy.sheet.journeyLabels.uncertain | Uncertain | Nav pārliecības | 4e313210 | safety; checked |
| copy.sheet.journeyLabels.needs_professional | Best done by a colourist | Vislabāk uzticēt koloristam | 416f2703 | safety; checked |
| copy.sheet.rows.kind | Fade | Fade | 9efb597c | same |
| copy.sheet.rows.start | Starts at | Sākas pie | faca355f |  |
| copy.sheet.rows.note | Note | Piezīme | d8da2c49 |  |
| copy.sheet.rows.neckline | Neckline | Kakla līnija | 2ffc239c |  |
| copy.sheet.rows.sideburns | Sideburns | Bakbārdas | 21d75ff6 |  |
| copy.sheet.rows.sits | Sits | Sniedzas līdz | c4124d63 |  |
| copy.sheet.rows.alsoWorks | Also works as | Der arī kā | ac1a9c3e |  |
| copy.sheet.rows.layers | Layers | Pakāpes | 0bcd66e6 |  |
| copy.sheet.rows.texture | Texture | Tekstūra | e28411a3 |  |
| copy.sheet.rows.density | Density | Blīvums | 77a283d6 |  |
| copy.sheet.rows.strand | Strand | Mata stiebrs | 770baae2 |  |
| copy.sheet.rows.growth | Growth | Augšanas virziens | 66b06e99 |  |
| copy.sheet.rows.whorl | Crown whorl | Pakauša virpulis | aa73a1db |  |
| copy.sheet.rows.glasses | Glasses | Brilles | eb25ede2 |  |
| copy.sheet.rows.shrinkage | Shrinkage | Saraušanās | 801bfa44 |  |
| copy.sheet.rows.styling | Styling | Veidošana | 92409c65 |  |
| copy.sheet.rows.trim | Trim | Pielīdzināšana | aaa5478b |  |
| copy.sheet.rows.heatUse | Heat | Karstie rīki | ee255635 |  |
| copy.sheet.rows.products | Products | Līdzekļi | 4edc8bfa |  |
| copy.sheet.rows.base | Base | Bāze | 7b47361a |  |
| copy.sheet.rows.lightenFirst | Lightened first | Vispirms jābalina | d8d9ab31 |  |
| copy.sheet.rows.visits | Visits | Vizītes | f514c310 |  |
| copy.sheet.rows.label | Journey | Ceļš līdz mērķim | fe50ed10 |  |
| copy.sheet.rows.why | Why | Kāpēc | d3ae14a5 |  |
| copy.sheet.rows.ask | What to ask | Ko jautāt | 9f87c032 |  |
| copy.sheet.rows.reminder | Reminder | Atgādinājums | 31757bbf |  |
| copy.sheet.rows.notes | Notes | Piezīmes | 8a7525b1 |  |
| copy.sheet.rows.framing | Framing | Sejas ierāmējums | 4de57f8f |  |
| copy.sheet.rows.tradeOff | Trade-off | Kompromiss | c6a25797 |  |
| copy.sheet.tones.ash | ash | pelnu | 037d390c |  |
| copy.sheet.tones.beige | beige | bēšs | b4f0534e |  |
| copy.sheet.tones.pearl | pearl | pērļu | 26e3b2a5 |  |
| copy.sheet.tones.silver | silver | sudraba | 78cde64c |  |
| copy.sheet.tones.neutral | neutral | neitrāls | 7e2372f4 |  |
| copy.sheet.tones.golden | golden | zeltains | dd56de41 |  |
| copy.sheet.tones.honey | honey | medus | a55e2e38 |  |
| copy.sheet.tones.caramel | caramel | karameļu | a40010d6 |  |
| copy.sheet.tones.copper | copper | vara | d16f06fe |  |
| copy.sheet.tones.red | red | sarkans | b1f51a51 |  |
| copy.sheet.tones.red_brown | red brown | sarkanbrūns | 5630176e |  |
| copy.sheet.tones.chestnut | chestnut | kastaņbrūns | 06d92f17 |  |
| copy.sheet.tones.chocolate | chocolate | šokolādes | 7499aced |  |
| copy.sheet.tones.mahogany | mahogany | mahagons | 30ff9ed8 |  |
| copy.sheet.tones.burgundy | burgundy | bordo | b8cfbefe |  |
| copy.sheet.tones.plum | plum | plūmju | 04672556 |  |
| copy.sheet.tones.rose | rose | rožu | 618d663a |  |
| copy.sheet.tones.pink | pink | rozā | a67a41c8 |  |
| copy.sheet.tones.lavender | lavender | lavandas | fef8cec0 |  |
| copy.sheet.tones.teal | teal | zilganzaļš | 2655399a |  |
| copy.sheet.tones.blue | blue | zils | 16477688 |  |
| copy.sheet.ownBase | Your own colour stays wherever no placement covers the hair | Tava matu krāsa saglabājas visur, kur mati netiek krāsoti | b4555f13 |  |
| copy.sheet.openAnswers | Some answers that could change this are still open. | Vēl trūkst dažu atbilžu, kas to varētu mainīt. | e0691bea |  |
| copy.sheet.noRecord | Your answers do not settle this look yet. | Tavas atbildes vēl nenosaka šo tēlu. | 8edb6cf5 |  |
| copy.sheet.healthLine | If you are pregnant, breastfeeding or having medical treatment, tell your colourist first. | Ja esi stāvoklī, baro bērnu ar krūti vai saņem medicīnisku ārstēšanu, vispirms pasaki savam koloristam. | f0ac0fc6 | safety; checked |
| copy.sheet.aiLabel | AI picture, an illustration of the look | Mākslīgā intelekta attēls, tēla ilustrācija | b3181be1 |  |
| copy.board.title | My looks | Mani tēli | fb9fde2c |  |
| copy.board.aiLabel | AI picture, an illustration of the look | Mākslīgā intelekta attēls, tēla ilustrācija | b3181be1 |  |
| copy.prompts.needs.label | What I need | Kas man vajadzīgs | febbed79 |  |
| copy.prompts.needs.growOut | growing my hair out | audzēju matus | 6e7e5873 |  |
| copy.prompts.needs.scars | scalp scars covered | nosegt galvas ādas rētas | 6e97099b |  |
| copy.prompts.needs.tieBack | can tie it back | lai var saņemt matus | f427f5d3 |  |
| copy.prompts.needs.fringe.want | a fringe | priekšmatus | af112eec |  |
| copy.prompts.needs.fringe.open | maybe a fringe | varbūt priekšmatus | 2b5fd5a0 |  |
| copy.prompts.needs.fringe.avoid | no fringe | bez priekšmatiem | fa02e938 |  |
| copy.prompts.needs.top.very_short | very short on top | ļoti īsi augšpusē | 77864b64 |  |
| copy.prompts.needs.top.short | short on top | īsi augšpusē | e3edff4d |  |
| copy.prompts.needs.top.medium | medium on top | vidēji gari augšpusē | 2cd64453 |  |
| copy.prompts.needs.top.long | long on top | gari augšpusē | 852854a8 |  |
| copy.prompts.needs.change.subtle | a gentle change | nelielas pārmaiņas | 7e0ff926 |  |
| copy.prompts.needs.change.noticeable | a clear change | pamanāmas pārmaiņas | eb42c113 |  |
| copy.prompts.needs.change.bold | a big change | lielas pārmaiņas | 1720226d |  |
| copy.prompts.needs.wishes.wish.face_length:soften | fullness at the sides | apjoms sānos | dcc30e80 |  |
| copy.prompts.needs.wishes.wish.face_length:emphasise | a long line down my face | pagarināta līnija gar seju | d41023be |  |
| copy.prompts.needs.wishes.wish.face_width:soften | height and closer sides | apjoms augšpusē un piekļautāki sāni | a109913b |  |
| copy.prompts.needs.wishes.wish.face_width:emphasise | a soft, rounded shape | maiga, noapaļota forma | 85e03180 |  |
| copy.prompts.needs.wishes.wish.forehead:soften | more of my forehead covered | vairāk nosegta piere | 5a594f02 |  |
| copy.prompts.needs.wishes.wish.forehead:emphasise | my forehead open | atvērta piere | 95dbd7e4 |  |
| copy.prompts.needs.wishes.wish.jaw:emphasise | a clean line at my jaw | tīra līnija pie žokļa | 9b9f57c6 |  |
| copy.prompts.needs.wishes.wish.jaw:soften | soft layers at my jaw | maigas pakāpes pie žokļa | 3b848dc5 |  |
| copy.prompts.needs.wishes.wish.chin:emphasise | a clean line at my chin | tīra līnija pie zoda | 3ebe49fc |  |
| copy.prompts.needs.wishes.wish.chin:soften | soft ends past my chin | maigi gali zem zoda | a0bf16dc |  |
| copy.prompts.needs.wishes.wish.height:soften | less height on top | mazāk apjoma augšpusē | 9bf9e9a9 |  |
| copy.prompts.needs.wishes.wish.height:emphasise | more height on top | vairāk apjoma augšpusē | 32ac5a2e |  |
| copy.prompts.needs.wishes.wish.fullness:emphasise | fuller-looking hair | vizuāli biezāki mati | fb25a993 |  |
| copy.prompts.needs.wishes.wish.ears:soften | my ears covered | nosegtas ausis | 16b11cab |  |
| copy.prompts.needs.wishes.wish.ears:emphasise | my ears showing | atsegtas ausis | 915ef461 |  |
| copy.prompts.needs.wishes.wish.hairline:soften | my hairline showing less | mazāk redzama matu augšanas līnija | eed7192c |  |
| copy.prompts.tradeOffs.youSaid | you said | tu teici | 001630e6 |  |
| copy.prompts.tradeOffs.iSaid | I said | es teicu | 1dacc662 |  |
| explore.allFiltersOn:zero | All filters {n} on | Ieslēgti visi {n} filtri | 172ec872 | plural zero: 0, 10-20, 30, 40… |
| explore.allFiltersOn:one | All filters {n} on | Ieslēgts {n} filtrs | 172ec872 | plural one: 1, 21, 31, 41… (not 11) |
| explore.allFiltersOn:other | All filters {n} on | Ieslēgti visi {n} filtri | 172ec872 | plural other: 2-9, 22-29, 32-39… |
| explore.showResults | Show {count} | Rādīt {count} | a7e58303 |  |
| explore.count.styles:zero | {n} styles | {n} griezumu | 1a5dfaa3 | plural zero: 0, 10-20, 30, 40… |
| explore.count.styles:one | {n} styles | {n} griezums | 1a5dfaa3 | plural one: 1, 21, 31, 41… (not 11) |
| explore.count.styles:other | {n} styles | {n} griezumi | 1a5dfaa3 | plural other: 2-9, 22-29, 32-39… |
| explore.count.colours:zero | {n} colour looks | {n} krāsojumu | ea825026 | plural zero: 0, 10-20, 30, 40… |
| explore.count.colours:one | {n} colour looks | {n} krāsojums | ea825026 | plural one: 1, 21, 31, 41… (not 11) |
| explore.count.colours:other | {n} colour looks | {n} krāsojumi | ea825026 | plural other: 2-9, 22-29, 32-39… |
| explore.count.beards:zero | {n} beards | {n} bārdu | 9f126f18 | plural zero: 0, 10-20, 30, 40… |
| explore.count.beards:one | {n} beards | {n} bārda | 9f126f18 | plural one: 1, 21, 31, 41… (not 11) |
| explore.count.beards:other | {n} beards | {n} bārdas | 9f126f18 | plural other: 2-9, 22-29, 32-39… |
| explore.noResults/one | No {what} match this filter. | Šim filtram neatbilst neviens {what}. | e720c441 |  |
| explore.noResults/two | No {what} match both filters. | Abiem filtriem neatbilst neviens {what}. | 7aed144e |  |
| explore.noResults/more | No {what} match all {filters} filters. | Visiem {filters} filtriem neatbilst neviens {what}. | fd21b57b |  |
| explore.noSearchResults/filtered | No {what} match ‘{search}’ with these filters. | Ar šiem filtriem meklējumam ‘{search}’ neatbilst neviens {what}. | 197ddc34 |  |
| explore.noSearchResults/all | No {what} match ‘{search}’. | Meklējumam ‘{search}’ neatbilst neviens {what}. | 027c8319 |  |
| explore.removeQuestion | Remove ‘{labels}’? | Noņemt ‘{labels}’? | 0d21eeb3 |  |
| explore.remove | Remove {label} | Noņemt {label} | 57ce3c2c |  |
| explore.save | Save {name} | Saglabāt {name} | 20e60888 |  |
| explore.caption.range | {from} to {to} | No {from} līdz {to} | ba318cc1 |  |
| explore.caption.and | {items} | {items} | 96ff785d | same |
| explore.alt | {view}: {name}, on the {model} model. | {view}: {name}, uz modeļa {model}. | 9a547617 |  |
| explore.detail.position | {what}, {n} of {total} | {what}, {n} no {total} | 2cc916ed |  |
| explore.detail.onModel | On the {model} model | Uz modeļa {model} | 8aa6bede |  |
| explore.detail.works.textures | it is {list} | mati ir {list} | 3a59395d |  |
| explore.detail.works.adapt | it is {texture}: {note} | mati ir {texture}: {note} | e2094a68 |  |
| explore.detail.works.density | its density is {list} | matu biezums ir {list} | d1dc4295 |  |
| explore.detail.works.growth/none | it can grow for 0 weeks first | vispirms var augt 0 nedēļu | d6fb6432 |  |
| explore.detail.works.growth/weeks:zero | it can grow for {min}-{max} weeks first | vispirms var augt {min}–{max} nedēļu | fd76c6ec | plural zero: 0, 10-20, 30, 40… |
| explore.detail.works.growth/weeks:one | it can grow for {min}-{max} weeks first | vispirms var augt {min}–{max} nedēļu | fd76c6ec | plural one: 1, 21, 31, 41… (not 11) |
| explore.detail.works.growth/weeks:other | it can grow for {min}-{max} weeks first | vispirms var augt {min}–{max} nedēļas | fd76c6ec | plural other: 2-9, 22-29, 32-39… |
| explore.detail.or | {items} | {items} | 96ff785d | same |
| explore.detail.trimDays:zero | every {min}-{max} days | ik pēc {min}–{max} dienām | b0da17a1 | plural zero: 0, 10-20, 30, 40… |
| explore.detail.trimDays:one | every {min}-{max} days | ik pēc {min}–{max} dienas | b0da17a1 | plural one: 1, 21, 31, 41… (not 11) |
| explore.detail.trimDays:other | every {min}-{max} days | ik pēc {min}–{max} dienām | b0da17a1 | plural other: 2-9, 22-29, 32-39… |
| explore.detail.dailyMinutes:zero | {n} minutes a day | {n} minūšu dienā | c767048a | plural zero: 0, 10-20, 30, 40… |
| explore.detail.dailyMinutes:one | {n} minutes a day | {n} minūte dienā | c767048a | plural one: 1, 21, 31, 41… (not 11) |
| explore.detail.dailyMinutes:other | {n} minutes a day | {n} minūtes dienā | c767048a | plural other: 2-9, 22-29, 32-39… |
| explore.errors.code | Error code: {code} | Kļūdas kods: {code} | 0f37fca8 |  |
| consult.tools.code | Error code: {code} | Kļūdas kods: {code} | 0f37fca8 |  |
| consult.photo.added:zero | {n} photos added. | Pievienots {n} fotoattēlu. | cbaeced3 | plural zero: 0, 10-20, 30, 40… |
| consult.photo.added:one | {n} photos added. | Pievienots {n} fotoattēls. | cbaeced3 | plural one: 1, 21, 31, 41… (not 11) |
| consult.photo.added:other | {n} photos added. | Pievienoti {n} fotoattēli. | cbaeced3 | plural other: 2-9, 22-29, 32-39… |
| consult.photo.name | Photo {n} | Fotoattēls {n} | 4d7f6899 |  |
| consult.photo.makeMain | Make {name} the main photo | Iestatīt {name} kā galveno fotoattēlu | 29c6137d |  |
| consult.photo.remove | Remove {name} | Noņemt {name} | e6a3c4a1 |  |
| consult.photo.removeAsk | Remove {name}? It goes from this session. | Noņemt {name}? Tas tiks noņemts no šīs sesijas. | 5f81d197 |  |
| consult.questions.count | Question {n} of {total} | {n}. jautājums no {total} | 1eec1410 |  |
| consult.questions.limit/refused | You can choose up to {max}. Untick one to choose another. | Vari izvēlēties līdz {max}. Noņem atzīmi vienam, lai izvēlētos citu. | dbd15086 |  |
| consult.questions.limit/chosen:zero | {n} of up to {max} chosen | Izvēlēts {n} no maksimāli {max} | 7c16a03b | plural zero: 0, 10-20, 30, 40… |
| consult.questions.limit/chosen:one | {n} of up to {max} chosen | Izvēlēts {n} no maksimāli {max} | 7c16a03b | plural one: 1, 21, 31, 41… (not 11) |
| consult.questions.limit/chosen:other | {n} of up to {max} chosen | Izvēlēti {n} no maksimāli {max} | 7c16a03b | plural other: 2-9, 22-29, 32-39… |
| help.privacy.blocked | Blocked in this session: {count}. | Šajā sesijā bloķēts: {count}. | 256a9105 |  |
| help.method.toolLine | {name}: {state} | {name}: {state} | 12191a17 | same |
| save.status.day | Saved on this device. {left} | Saglabāts šajā ierīcē. {left} | b38d72fa |  |
| save.status.hoursLeft:zero | About {hours} hours left. | Atlicis aptuveni {hours} stundu. | 5973f199 | plural zero: 0, 10-20, 30, 40… |
| save.status.hoursLeft:one | About {hours} hours left. | Atlikusi aptuveni {hours} stunda. | 5973f199 | plural one: 1, 21, 31, 41… (not 11) |
| save.status.hoursLeft:other | About {hours} hours left. | Atlikušas aptuveni {hours} stundas. | 5973f199 | plural other: 2-9, 22-29, 32-39… |
| saved.favourites.remove | Remove {name} | Noņemt {name} | e6a3c4a1 |  |
| saved.favourites.removed | {name} removed from Saved. | {name} noņemts no saglabātajiem. | 59b32c7d |  |
| saved.example.on | On a fictional model: {model}, {collection}. | Uz izdomāta modeļa: {model}, {collection}. | 4c7610aa |  |
| tryOn.cards.split/all | All {sizes} together | Visi {sizes} kopā | f81eca54 |  |
| tryOn.cards.split/split | {sizes} | {sizes} | 51f0ef39 | same |
| tryOn.cards.title/one | Your card | Tava kartīte | 8c37d924 |  |
| tryOn.cards.title/more | Picture {n} of {total} | {n}. attēls no {total} | 37658e4c |  |
| tryOn.promptFailed | The prompt for this look could not be made. Error code: prompt_{code} | Neizdevās izveidot vaicājumu šim tēlam. Kļūdas kods: prompt_{code} | f734a58d |  |
| tryOn.grids.name/cuts:zero | Picture {n} of {total}: {count} cuts | {n}. attēls no {total}: {count} griezumu | 8be1d1ca | plural zero: 0, 10-20, 30, 40… |
| tryOn.grids.name/cuts:one | Picture {n} of {total}: {count} cuts | {n}. attēls no {total}: {count} griezums | 8be1d1ca | plural one: 1, 21, 31, 41… (not 11) |
| tryOn.grids.name/cuts:other | Picture {n} of {total}: {count} cuts | {n}. attēls no {total}: {count} griezumi | 8be1d1ca | plural other: 2-9, 22-29, 32-39… |
| tryOn.grids.name/colours:zero | Picture {n} of {total}: {count} colours | {n}. attēls no {total}: {count} krāsu | 4118687a | plural zero: 0, 10-20, 30, 40… |
| tryOn.grids.name/colours:one | Picture {n} of {total}: {count} colours | {n}. attēls no {total}: {count} krāsa | 4118687a | plural one: 1, 21, 31, 41… (not 11) |
| tryOn.grids.name/colours:other | Picture {n} of {total}: {count} colours | {n}. attēls no {total}: {count} krāsas | 4118687a | plural other: 2-9, 22-29, 32-39… |
| tryOn.grids.splitFailed:zero | This picture could not be cut into {count} tiles. Use one picture per look instead. | Šo attēlu neizdevās sadalīt {count} rūtiņās. Tā vietā izmanto vienu attēlu katram tēlam. | 577057bc | plural zero: 0, 10-20, 30, 40… |
| tryOn.grids.splitFailed:one | This picture could not be cut into {count} tiles. Use one picture per look instead. | Šo attēlu neizdevās sadalīt {count} rūtiņā. Tā vietā izmanto vienu attēlu katram tēlam. | 577057bc | plural one: 1, 21, 31, 41… (not 11) |
| tryOn.grids.splitFailed:other | This picture could not be cut into {count} tiles. Use one picture per look instead. | Šo attēlu neizdevās sadalīt {count} rūtiņās. Tā vietā izmanto vienu attēlu katram tēlam. | 577057bc | plural other: 2-9, 22-29, 32-39… |
| tryOn.grids.tileIs | Tile {n} is: {name} | {n}. rūtiņa ir: {name} | 68322bf4 |  |
| tryOn.grids.tileAlt | Tile {n} of the picture | Attēla {n}. rūtiņa | 48b46985 |  |
| tryOn.grids.moved | {name} is now tile {n}. | {name} tagad ir {n}. rūtiņā. | d68feaf8 |  |
| tryOn.grids.tileNamed | Tile {n}: {name} | {n}. rūtiņa: {name} | 7a78d48d |  |
| tryOn.grids.pictureAlt | The picture you added for {grid} | Attēls, ko pievienoji režģim {grid} | ae6e95a0 |  |
| tryOn.looks.journey | Colour: {label} | Krāsa: {label} | 5ffb2572 |  |
| tryOn.slot.label | Picture for {name} | Attēls tēlam {name} | fe5b565a |  |
| tryOn.slot.alt | Your AI picture for {name} | Tavs MI attēls tēlam {name} | 05dda4cb |  |
| tryOn.slot.added | Picture added for {name}. | Pievienots attēls tēlam {name}. | 4d9d402d |  |
| tryOn.slot.removed | Picture removed for {name}. | Noņemts attēls tēlam {name}. | a596255d |  |
| tryOn.repair.failed | The repair prompt could not be made. Error code: prompt_{code} | Neizdevās izveidot labojuma vaicājumu. Kļūdas kods: prompt_{code} | 50156a89 |  |
| tryOn.board.compare | Compare {name} with your photo | Salīdzini {name} ar savu foto | b9e89d9b |  |
| tryOn.board.compareTitle | Your photo and {name} | Tavs foto un {name} | bd094806 |  |
| tryOn.board.compareValue | {n} percent your photo | {n}% no tava foto | 50c7b67d |  |
| tryOn.board.hairOnlyAlt | Hair-only version of {name} on your photo | Tēla {name} versija tikai ar matiem uz tava foto | 3c3f734c |  |
| tryOn.board.pictureAlt | {name}, AI picture | {name}, MI attēls | a2d6c368 |  |
| ideas.colours.withColour/plain | In the prompt and the card: {name}. The picture keeps the model's own colour. | Vaicājumā un kartītē: {name}. Attēlā saglabājas paša modeļa matu krāsa. | 35cbd477 |  |
| ideas.colours.withColour/labelled | In the prompt and the card: {name} ({label}). The picture keeps the model's own colour. | Vaicājumā un kartītē: {name} ({label}). Attēlā saglabājas paša modeļa matu krāsa. | 18b3da05 |  |
| ideas.feasibility.growth/cm5 | Needs up to about 5 cm more length | Vajadzīgi vēl līdz aptuveni 5 cm garuma | 25dc8ead |  |
| ideas.feasibility.growth/cm10 | Needs about 5 to 10 cm more length | Vajadzīgi vēl aptuveni 5 līdz 10 cm garuma | 11458222 |  |
| ideas.feasibility.growth/cm20 | Needs about 10 to 20 cm more length | Vajadzīgi vēl aptuveni 10 līdz 20 cm garuma | 30d9e1ba |  |
| ideas.feasibility.growth/cmMore | Needs more than 20 cm more length | Vajadzīgi vēl vairāk nekā 20 cm garuma | f1d5c5bb |  |
| ideas.feasibility.growth/cm5Months | Needs up to about 5 cm more length, a few months of growth | Vajadzīgi vēl līdz aptuveni 5 cm garuma, jāaudzē daži mēneši | b2da883a |  |
| ideas.feasibility.growth/cm10Months | Needs about 5 to 10 cm more length, a few months of growth | Vajadzīgi vēl aptuveni 5 līdz 10 cm garuma, jāaudzē daži mēneši | e412be61 |  |
| ideas.feasibility.growth/cm20Months | Needs about 10 to 20 cm more length, a few months of growth | Vajadzīgi vēl aptuveni 10 līdz 20 cm garuma, jāaudzē daži mēneši | 2c33f430 |  |
| ideas.feasibility.growth/cmMoreMonths | Needs more than 20 cm more length, a few months of growth | Vajadzīgi vēl vairāk nekā 20 cm garuma, jāaudzē daži mēneši | 6d1afc4d |  |
| ideas.feasibility.growth/cm5Year | Needs up to about 5 cm more length, up to a year of growth | Vajadzīgi vēl līdz aptuveni 5 cm garuma, jāaudzē līdz pat gadam | 13bf1dc2 |  |
| ideas.feasibility.growth/cm10Year | Needs about 5 to 10 cm more length, up to a year of growth | Vajadzīgi vēl aptuveni 5 līdz 10 cm garuma, jāaudzē līdz pat gadam | 282a7e0f |  |
| ideas.feasibility.growth/cm20Year | Needs about 10 to 20 cm more length, up to a year of growth | Vajadzīgi vēl aptuveni 10 līdz 20 cm garuma, jāaudzē līdz pat gadam | e949f6a5 |  |
| ideas.feasibility.growth/cmMoreYear | Needs more than 20 cm more length, up to a year of growth | Vajadzīgi vēl vairāk nekā 20 cm garuma, jāaudzē līdz pat gadam | 6d9088a4 |  |
| ideas.feasibility.growth/cm5Longer | Needs up to about 5 cm more length, more than a year of growth | Vajadzīgi vēl līdz aptuveni 5 cm garuma, jāaudzē vairāk nekā gadu | 8ed4ee34 |  |
| ideas.feasibility.growth/cm10Longer | Needs about 5 to 10 cm more length, more than a year of growth | Vajadzīgi vēl aptuveni 5 līdz 10 cm garuma, jāaudzē vairāk nekā gadu | 8728ffa0 |  |
| ideas.feasibility.growth/cm20Longer | Needs about 10 to 20 cm more length, more than a year of growth | Vajadzīgi vēl aptuveni 10 līdz 20 cm garuma, jāaudzē vairāk nekā gadu | 090445bc |  |
| ideas.feasibility.growth/cmMoreLonger | Needs more than 20 cm more length, more than a year of growth | Vajadzīgi vēl vairāk nekā 20 cm garuma, jāaudzē vairāk nekā gadu | 0f06130f |  |
| ideas.feasibility.adapting | Needs adapting: {notes} | Jāpielāgo: {notes} | e8fae32f |  |
| ideas.answerToKnow | Answer ‘{prompt}’ to narrow it down | Atbildi uz ‘{prompt}’, lai to precizētu | 1a8b75fe |  |
| ideas.dependsOn | Depends on your {noun} | Atkarīgs no tava {noun} | 1158cbaa |  |
| ideas.dependsOnAnswer | Depends on your answer to ‘{prompt}’ | Atkarīgs no tavas atbildes uz ‘{prompt}’ | 47c87a56 |  |
| ideas.answer | Answer ‘{prompt}’ | Atbildi uz ‘{prompt}’ | ce466a0e |  |
| ideas.removed | {name} removed from your list. | {name} noņemts no tava saraksta. | d2f5c21c |  |
| ideas.moved | {name} moved to {n} of {total}. | {name} pārvietots uz {n}. vietu no {total}. | c8a9b04d |  |
| ideas.improve.couldChange/one | Your answer could change 1 of your ideas. | Tava atbilde varētu mainīt 1 no tavām idejām. | 1174be4a |  |
| ideas.improve.couldChange/more:zero | Your answer could change up to {n} of your ideas. | Tava atbilde varētu mainīt līdz pat {n} no tavām idejām. | f402e154 | plural zero: 0, 10-20, 30, 40… |
| ideas.improve.couldChange/more:one | Your answer could change up to {n} of your ideas. | Tava atbilde varētu mainīt līdz pat {n} no tavām idejām. | f402e154 | plural one: 1, 21, 31, 41… (not 11) |
| ideas.improve.couldChange/more:other | Your answer could change up to {n} of your ideas. | Tava atbilde varētu mainīt līdz pat {n} no tavām idejām. | f402e154 | plural other: 2-9, 22-29, 32-39… |
| ideas.shortfall.found/none | No idea fits your hair and all your answers now, so change an answer or add one from Explore. | Šobrīd taviem matiem un visām atbildēm neatbilst neviena ideja, tāpēc pamaini kādu atbildi vai pievieno jaunu no sadaļas «Izpēti». | e28cdd29 |  |
| ideas.shortfall.found/some:zero | We found {n} that suit your hair and limits. | Atradām {n} variantu, kas atbilst taviem matiem un ierobežojumiem. | 07a28f18 | plural zero: 0, 10-20, 30, 40… |
| ideas.shortfall.found/some:one | We found {n} that suit your hair and limits. | Atradām {n} variantu, kas atbilst taviem matiem un ierobežojumiem. | 07a28f18 | plural one: 1, 21, 31, 41… (not 11) |
| ideas.shortfall.found/some:other | We found {n} that suit your hair and limits. | Atradām {n} variantus, kas atbilst taviem matiem un ierobežojumiem. | 07a28f18 | plural other: 2-9, 22-29, 32-39… |
| ideas.shortfall.removed:zero | You removed {n} ideas. | Tu noņēmi {n} ideju. | 557d2da6 | plural zero: 0, 10-20, 30, 40… |
| ideas.shortfall.removed:one | You removed {n} ideas. | Tu noņēmi {n} ideju. | 557d2da6 | plural one: 1, 21, 31, 41… (not 11) |
| ideas.shortfall.removed:other | You removed {n} ideas. | Tu noņēmi {n} idejas. | 557d2da6 | plural other: 2-9, 22-29, 32-39… |
| ideas.shortfall.library | The library has no more {what} for what you chose to see. | Bibliotēkā vairs nav {what}, kas atbilstu tavai izvēlei. | 8986173c |  |
| ideas.aiPick.action/one | Let ChatGPT or Gemini pick your best one | Ļauj ChatGPT vai Gemini izvēlēties tev labāko variantu | 2ee6fb31 |  |
| ideas.aiPick.action/more:zero | Let ChatGPT or Gemini pick your best {n} | Ļauj ChatGPT vai Gemini piemeklēt tev {n} labāko variantu | 63f2f86d | plural zero: 0, 10-20, 30, 40… |
| ideas.aiPick.action/more:one | Let ChatGPT or Gemini pick your best {n} | Ļauj ChatGPT vai Gemini piemeklēt tev {n} labāko variantu | 63f2f86d | plural one: 1, 21, 31, 41… (not 11) |
| ideas.aiPick.action/more:other | Let ChatGPT or Gemini pick your best {n} | Ļauj ChatGPT vai Gemini piemeklēt tev {n} labākos variantus | 63f2f86d | plural other: 2-9, 22-29, 32-39… |
| ideas.aiPick.failed | The prompt could not be made. Error code: {code} | Neizdevās izveidot vaicājumu. Kļūdas kods: {code} | 1540dcbd |  |
| ideas.worthAsking.added | {name} added to your list. | {name} pievienots tavam sarakstam. | 799b64e0 |  |
| ideas.givesWay/greyGoalGrey | Your hair is already as light as it gets, so no colour here can take it further. | Tavi mati jau ir tik gaiši, cik vien iespējams, tāpēc neviena krāsa šeit nevar padarīt tos vēl gaišākus. | e3be5d60 |  |
| ideas.givesWay/greyGoal | Your hair is already as light as it gets, so no colour here can take it further. | Tavi mati jau ir tik gaiši, cik vien iespējams, tāpēc neviena krāsa šeit nevar padarīt tos vēl gaišākus. | e3be5d60 |  |
| ideas.givesWay/darkerGrey | Your hair is already as dark as it gets, so no colour here can take it further. | Tavi mati jau ir tik tumši, cik vien iespējams, tāpēc neviena krāsa šeit nevar padarīt tos vēl tumšākus. | d96f6987 |  |
| ideas.givesWay/darker | Your hair is already as dark as it gets, so no colour here can take it further. | Tavi mati jau ir tik tumši, cik vien iespējams, tāpēc neviena krāsa šeit nevar padarīt tos vēl tumšākus. | d96f6987 |  |
| ideas.givesWay/lighterGrey | Your hair is already as light as it gets, so no colour here can take it further. | Tavi mati jau ir tik gaiši, cik vien iespējams, tāpēc neviena krāsa šeit nevar padarīt tos vēl gaišākus. | e3be5d60 |  |
| ideas.givesWay/lighter | Your hair is already as light as it gets, so no colour here can take it further. | Tavi mati jau ir tik gaiši, cik vien iespējams, tāpēc neviena krāsa šeit nevar padarīt tos vēl gaišākus. | e3be5d60 |  |
| face.canvas | Your photo with lines on the {names}. | Tavs foto ar līnijām uz {names}. | 786412fb |  |
| face.more.refineHint | Tap your hair so the outline fits it better; about {mb} MB the first time. | Pieskaries matiem, lai kontūra tiem labāk atbilstu; pirmajā reizē aptuveni {mb} MB. | 84fd4aab |  |
| face.more.threeDHint | To look at, not to measure; about {mb} MB the first time. | Apskatei, nevis mērīšanai; pirmajā reizē aptuveni {mb} MB. | fae31a3e |  |
| face.explain.failed | The prompt to explain your face card could not be made. Error code: prompt_{code} | Neizdevās izveidot vaicājumu tavas sejas kartītes skaidrojumam. Kļūdas kods: prompt_{code} | 16de5885 |  |
| face.colour.hair | Hair colour: close to {shade} (hint) | Matu krāsa: aptuveni {shade} (norāde) | c2919c70 |  |
| face.colour.skin | Skin tone: {depth} (hint) | Ādas tonis: {depth} (norāde) | ec7e8cad |  |
| face.colour.undertone | Undertone: {answer} (your answer) | Apakštonis: {answer} (tava atbilde) | eb2f22e1 |  |
| face.mover.moveLabel | Move the {part} | Pārvieto {part} | 17f89ce5 |  |
| face.mover.moved | {part} moved | {part} pārvietots | a9278190 |  |
| face.mover.putBack | Put the {part} back | Atliec {part} atpakaļ | 7c8de036 |  |
| face.mover.putBackDone | {part} is back where it was found. | {part} ir atpakaļ sākotnējā vietā. | c0e39e0e |  |
| extras.preview.shown | {name}, rough preview on your photo | {name}, aptuvens priekšskatījums uz tava foto | cbf935ae |  |
| extras.preview.compareValue | {percent} percent of your own photo showing | Redzami {percent} procenti no tava paša foto | cf7749e7 |  |
| extras.refine.hint | Downloads the tap tool, about {mb} MB the first time. | Lejupielādē pieskāriena rīku, pirmajā reizē aptuveni {mb} MB. | f9c88c0c |  |
| extras.tap.spot | Spot {across} percent across and {down} percent down. | Punkts {across} procentus no kreisās puses un {down} procentus no augšas. | 98f24bac |  |
| extras.threeD.facing/front | Facing front. | Pavērsts uz priekšu. | 9c9fa579 |  |
| extras.threeD.facing/left | Turned {yaw} degrees left. | Pagriezts par {yaw} grādiem pa kreisi. | 70443062 |  |
| extras.threeD.facing/right | Turned {yaw} degrees right. | Pagriezts par {yaw} grādiem pa labi. | 6114c3cd |  |
| extras.threeD.facing/up | Tilted {tilt} degrees up. | Pacelts par {tilt} grādiem uz augšu. | c3d99bbd |  |
| extras.threeD.facing/down | Tilted {tilt} degrees down. | Noliekts par {tilt} grādiem uz leju. | 745bcd48 |  |
| extras.threeD.facing/leftUp | Turned {yaw} degrees left, tilted {tilt} degrees up. | Pagriezts par {yaw} grādiem pa kreisi, pacelts par {tilt} grādiem uz augšu. | e3cbe243 |  |
| extras.threeD.facing/leftDown | Turned {yaw} degrees left, tilted {tilt} degrees down. | Pagriezts par {yaw} grādiem pa kreisi, noliekts par {tilt} grādiem uz leju. | acdb36bf |  |
| extras.threeD.facing/rightUp | Turned {yaw} degrees right, tilted {tilt} degrees up. | Pagriezts par {yaw} grādiem pa labi, pacelts par {tilt} grādiem uz augšu. | 7ec238cc |  |
| extras.threeD.facing/rightDown | Turned {yaw} degrees right, tilted {tilt} degrees down. | Pagriezts par {yaw} grādiem pa labi, noliekts par {tilt} grādiem uz leju. | 1411582c |  |
| copy.faceCard.date | {day} {month} {year} | {day} {month} {year} | ade39ee8 | same |
| copy.faceNotes.face.proportion.says | In this photo, your face is {words} | Šajā fotoattēlā tava seja ir {words} | 28a48663 |  |
| copy.faceNotes.face.proportion.number | Your face is about {ratio} times as long as it is wide | Tava seja ir apmēram {ratio} reizes garāka nekā plata | 366d1b87 |  |
| copy.faceNotes.face.forehead_share.says | In this photo, your forehead section is {words} | Šajā fotoattēlā tava pieres daļa ir {words} | c68948ba |  |
| copy.faceNotes.face.forehead_share.number | This part takes up about {upper}% of your face height. Middle about {middle}% | Šī daļa aizņem apmēram {upper}% no tavas sejas augstuma. Vidusdaļa — apmēram {middle}% | bd9a661c |  |
| copy.faceNotes.face.lower_share.says | In this photo, your nose-to-chin section is {words} | Šajā fotoattēlā sejas daļa no deguna līdz zodam ir {words} | 1cd083ff |  |
| copy.faceNotes.face.lower_share.number | This part takes up about {lower}% of your face height | Šī daļa aizņem apmēram {lower}% no tavas sejas augstuma | 4cb19bff |  |
| copy.faceNotes.face.jaw_vs_cheek.says | In this photo, your jaw is {words} | Šajā fotoattēlā tavs žoklis ir {words} | dd1551c7 |  |
| copy.faceNotes.face.jaw_vs_cheek.number | Your jaw is about {jaw}% as wide as your cheeks | Tavs žoklis ir aptuveni {jaw}% no vaigu platuma | 0adb290c |  |
| copy.facts.colour.natural_level.value | level {n} of 10 | {n}. līmenis no 10 | f2c2f29f |  |
| copy.facts.colour.current_level_lengths.value | level {n} of 10 | {n}. līmenis no 10 | f2c2f29f |  |
| copy.facts.colour.bleach_count.value/never | never | nekad | 6497e4b3 |  |
| copy.facts.colour.bleach_count.value/once | once | vienu reizi | 200651a8 |  |
| copy.facts.colour.bleach_count.value/many | 4 or more times | 4 vai vairāk reizes | f0ef06d5 |  |
| copy.facts.colour.bleach_count.value/some:zero | {n} times | {n} reižu | 0dffdde2 | plural zero: 0, 10-20, 30, 40… |
| copy.facts.colour.bleach_count.value/some:one | {n} times | {n} reizi | 0dffdde2 | plural one: 1, 21, 31, 41… (not 11) |
| copy.facts.colour.bleach_count.value/some:other | {n} times | {n} reizes | 0dffdde2 | plural other: 2-9, 22-29, 32-39… |
| copy.facts.colour.grey_percent.value | about {n}% | aptuveni {n}% | d44d0dcf |  |
| copy.sheet.cm/same | {max} cm | {max} cm | 577ce601 | same |
| copy.sheet.cm/range | {min}-{max} cm | {min}-{max} cm | 6bacaf0f | same |
| copy.sheet.guard/skin | skin, 0 mm | līdz ādai, 0 mm | f8640999 |  |
| copy.sheet.guard/guard | #{guard}, {mm} mm | #{guard}, {mm} mm | a62f872d | same |
| copy.sheet.guards | {from} to {to} | No {from} līdz {to} | ba318cc1 |  |
| copy.sheet.textureFor | For {texture} hair | Piemērots: {texture} mati | c307702b |  |
| copy.sheet.minutes/same:zero | {max} minutes a day | {max} minūšu dienā | 624edf9f | plural zero: 0, 10-20, 30, 40… |
| copy.sheet.minutes/same:one | {max} minutes a day | {max} minūte dienā | 624edf9f | plural one: 1, 21, 31, 41… (not 11) |
| copy.sheet.minutes/same:other | {max} minutes a day | {max} minūtes dienā | 624edf9f | plural other: 2-9, 22-29, 32-39… |
| copy.sheet.minutes/range:zero | {min}-{max} minutes a day | {min}-{max} minūšu dienā | 2d415f04 | plural zero: 0, 10-20, 30, 40… |
| copy.sheet.minutes/range:one | {min}-{max} minutes a day | {min}-{max} minūte dienā | 2d415f04 | plural one: 1, 21, 31, 41… (not 11) |
| copy.sheet.minutes/range:other | {min}-{max} minutes a day | {min}-{max} minūtes dienā | 2d415f04 | plural other: 2-9, 22-29, 32-39… |
| copy.sheet.weeks/one | every week | katru nedēļu | 845e5947 |  |
| copy.sheet.weeks/same:zero | every {max} weeks | ik pēc {max} nedēļām | 52496e62 | plural zero: 0, 10-20, 30, 40… |
| copy.sheet.weeks/same:one | every {max} weeks | ik pēc {max} nedēļas | 52496e62 | plural one: 1, 21, 31, 41… (not 11) |
| copy.sheet.weeks/same:other | every {max} weeks | ik pēc {max} nedēļām | 52496e62 | plural other: 2-9, 22-29, 32-39… |
| copy.sheet.weeks/range:zero | every {min}-{max} weeks | ik pēc {min}-{max} nedēļām | 4f072522 | plural zero: 0, 10-20, 30, 40… |
| copy.sheet.weeks/range:one | every {min}-{max} weeks | ik pēc {min}-{max} nedēļas | 4f072522 | plural one: 1, 21, 31, 41… (not 11) |
| copy.sheet.weeks/range:other | every {min}-{max} weeks | ik pēc {min}-{max} nedēļām | 4f072522 | plural other: 2-9, 22-29, 32-39… |
| copy.sheet.percent/same | about {max}% when dry | aptuveni {max}% izžūstot | 4081d61a |  |
| copy.sheet.percent/range | about {min}-{max}% when dry | aptuveni {min}-{max}% izžūstot | e4494a0e |  |
| copy.sheet.shade/same | {name}, level {max}, {tone} tone | {name}, {max}. līmenis, {tone} tonis | 6aa9de78 |  |
| copy.sheet.shade/range | {name}, level {min}-{max}, {tone} tone | {name}, {min}.-{max}. līmenis, {tone} tonis | 255b969e |  |
| copy.sheet.applied | {technique} in {shade} | {technique} tonī {shade} | 1cae11aa |  |
| copy.sheet.lightenTo | to level {n} before the shades go on | līdz {n}. līmenim pirms toņu uzklāšanas | ea940408 |  |
| copy.sheet.pairTitle | Together: {cut}, with {colour} | Kopā: {cut}, ar {colour} | 6a5f4bcb |  |
| copy.board.pairName | Together: {cut}, with {colour} | Kopā: {cut}, ar {colour} | 6a5f4bcb |  |
| copy.board.lookName | {cut} in {colour} | {cut} tonī {colour} | 47677473 |  |
| copy.prompts.needs.trim/w2 | a trim every 2-4 weeks | apgriešana ik pēc 2-4 nedēļām | d16443b6 |  |
| copy.prompts.needs.trim/w4 | a trim every 4-6 weeks | apgriešana ik pēc 4-6 nedēļām | c51c2b40 |  |
| copy.prompts.needs.trim/w6 | a trim every 6-8 weeks | apgriešana ik pēc 6-8 nedēļām | fdd43061 |  |
| copy.prompts.needs.trim/w12 | trims about every 3 months | apgriešana aptuveni ik pēc 3 mēnešiem | ae4d1080 |  |
| copy.prompts.needs.trim/other:zero | a trim every {weeks} weeks | apgriešana ik pēc {weeks} nedēļām | 8e619d5e | plural zero: 0, 10-20, 30, 40… |
| copy.prompts.needs.trim/other:one | a trim every {weeks} weeks | apgriešana ik pēc {weeks} nedēļas | 8e619d5e | plural one: 1, 21, 31, 41… (not 11) |
| copy.prompts.needs.trim/other:other | a trim every {weeks} weeks | apgriešana ik pēc {weeks} nedēļām | 8e619d5e | plural other: 2-9, 22-29, 32-39… |
| copy.prompts.needs.styling/m7 | about 5 minutes of styling | aptuveni 5 minūtes ieveidošanai | ceb50fcc |  |
| copy.prompts.needs.styling/m12 | about 10 minutes of styling | aptuveni 10 minūtes ieveidošanai | cb4dcb70 |  |
| copy.prompts.needs.styling/m20 | styling up to 20 minutes | līdz 20 minūtēm ieveidošanai | 2a29d0d3 |  |
| copy.prompts.needs.styling/m60 | I enjoy styling | Man patīk ieveidot matus | ca1b2fcc |  |
| copy.prompts.needs.styling/other:zero | {minutes} minutes styling a day | {minutes} minūšu ieveidošanai dienā | d4b8c6fc | plural zero: 0, 10-20, 30, 40… |
| copy.prompts.needs.styling/other:one | {minutes} minutes styling a day | {minutes} minūte ieveidošanai dienā | d4b8c6fc | plural one: 1, 21, 31, 41… (not 11) |
| copy.prompts.needs.styling/other:other | {minutes} minutes styling a day | {minutes} minūtes ieveidošanai dienā | d4b8c6fc | plural other: 2-9, 22-29, 32-39… |
| copy.prompts.tradeOffs.styling:zero | {minutes} minutes of styling | {minutes} minūšu ieveidošanai | cd37cac4 | plural zero: 0, 10-20, 30, 40… |
| copy.prompts.tradeOffs.styling:one | {minutes} minutes of styling | {minutes} minūte ieveidošanai | cd37cac4 | plural one: 1, 21, 31, 41… (not 11) |
| copy.prompts.tradeOffs.styling:other | {minutes} minutes of styling | {minutes} minūtes ieveidošanai | cd37cac4 | plural other: 2-9, 22-29, 32-39… |
| copy.prompts.tradeOffs.trim/same:zero | a trim every {max} weeks | apgriešana ik pēc {max} nedēļām | d660f887 | plural zero: 0, 10-20, 30, 40… |
| copy.prompts.tradeOffs.trim/same:one | a trim every {max} weeks | apgriešana ik pēc {max} nedēļas | d660f887 | plural one: 1, 21, 31, 41… (not 11) |
| copy.prompts.tradeOffs.trim/same:other | a trim every {max} weeks | apgriešana ik pēc {max} nedēļām | d660f887 | plural other: 2-9, 22-29, 32-39… |
| copy.prompts.tradeOffs.trim/range:zero | a trim every {min} to {max} weeks | apgriešana ik pēc {min} līdz {max} nedēļām | bf520918 | plural zero: 0, 10-20, 30, 40… |
| copy.prompts.tradeOffs.trim/range:one | a trim every {min} to {max} weeks | apgriešana ik pēc {min} līdz {max} nedēļas | bf520918 | plural one: 1, 21, 31, 41… (not 11) |
| copy.prompts.tradeOffs.trim/range:other | a trim every {min} to {max} weeks | apgriešana ik pēc {min} līdz {max} nedēļām | bf520918 | plural other: 2-9, 22-29, 32-39… |
| copy.prompts.tradeOffs.growth/first | more length first | vispirms ataudzēt garumu | de9d226a |  |
| copy.prompts.tradeOffs.growth/months | a few months of growth | daži mēneši ataudzēšanai | ed82c52d |  |
| copy.prompts.tradeOffs.growth/year | up to a year of growth | līdz pat gadam ataudzēšanai | 65eec54f |  |
| copy.prompts.tradeOffs.growth/longer | more than a year of growth | vairāk nekā gads ataudzēšanai | 2d8a6e27 |  |
| copy.prompts.tradeOffs.sentence/growth | Needs {growth} | Vajadzēs {growth} | eaa4b814 |  |
| copy.prompts.tradeOffs.sentence/one | Needs {limits}, more than {said} | Vajadzēs {limits}, vairāk nekā {said} | d26bd65a |  |
| copy.prompts.tradeOffs.sentence/two | Needs {limits}, both more than {said} | Vajadzēs {limits}, abi vairāk nekā {said} | 1de7f345 |  |
| copy.prompts.tradeOffs.sentence/growthOne | Needs {growth}, and {limits}, more than {said} | Vajadzēs {growth}, kā arī {limits}, vairāk nekā {said} | dce11737 |  |
| copy.prompts.tradeOffs.sentence/growthTwo | Needs {growth}, and {limits}, both more than {said} | Vajadzēs {growth}, kā arī {limits}, abi vairāk nekā {said} | 73d1e01c |  |
| copy.prompts.ownBase | my own level {level} colour | mana {level}. līmeņa matu krāsa | a98ae7be |  |
| reasons.reason/none | {reason}. | {reason}. | 04c74dc8 | same |
| reasons.reason/cut | {reason}, so this cut has {phrases}. | {reason}, tāpēc šim griezumam ir {phrases}. | 642cd42e |  |
| reasons.reason/colour | {reason}, so this look has {phrases}. | {reason}, tāpēc šim tēlam ir {phrases}. | 1f421203 |  |
| reasons.reason/beard | {reason}, so this beard has {phrases}. | {reason}, tāpēc šai bārdai ir {phrases}. | f21a697a |  |
| reasons.both | {parts} | {parts} | ef898fa9 | same |
| reasons.weeks/one | 1 week | 1 nedēļa | c8cc5223 |  |
| reasons.weeks/more:zero | {n} weeks | {n} nedēļu | 3c7b8339 | plural zero: 0, 10-20, 30, 40… |
| reasons.weeks/more:one | {n} weeks | {n} nedēļa | 3c7b8339 | plural one: 1, 21, 31, 41… (not 11) |
| reasons.weeks/more:other | {n} weeks | {n} nedēļas | 3c7b8339 | plural other: 2-9, 22-29, 32-39… |
| reasons.minutes/one | 1 minute | 1 minūte | e67b6f61 |  |
| reasons.minutes/more:zero | {n} minutes | {n} minūšu | 9a36ae74 | plural zero: 0, 10-20, 30, 40… |
| reasons.minutes/more:one | {n} minutes | {n} minūte | 9a36ae74 | plural one: 1, 21, 31, 41… (not 11) |
| reasons.minutes/more:other | {n} minutes | {n} minūtes | 9a36ae74 | plural other: 2-9, 22-29, 32-39… |

## Content

| id | English | Latvian | source | notes |
| --- | --- | --- | --- | --- |
| beard-clean-shaven.name | Clean shaven | Gludi skūts | 57cb4463 |  |
| beard-clean-shaven.growth.note | No growth needed. | Bārda nav jāaudzē. | 80bf7bcb |  |
| beard-clean-shaven.upkeep.products.0 | shave cream | skūšanās krēms | 4146a3ec |  |
| beard-clean-shaven.upkeep.products.1 | balm | balzams | 1b7300cd |  |
| beard-clean-shaven.client | No facial hair. Smooth, formal and quick to maintain, though shaving daily takes time. | Bez sejas apmatojuma. Gluds, lietišķs un ātri sakopjams, lai gan ikdienas skūšanās prasa laiku. | 0ca70b68 |  |
| beard-clean-shaven.stylist | Pre-shave oil or warm towel, shave with the grain first. Moisturise afterwards; flag razor-bump-prone skin and suggest a longer stubble instead. | Pirms skūšanās lieto eļļu vai siltu dvieli, vispirms skuj matiņu augšanas virzienā. Pēc tam mitrini ādu; ja ādai ir nosliece uz kairinājumu pēc skūšanās, pievērs tam uzmanību un tā vietā iesaki garākus rugājus. | f80c1de1 |  |
| beard-stubble-short.name | Short stubble | Īsi rugāji | 36abd97c |  |
| beard-stubble-short.growth.note | Any growth, even patchy. | Der jebkāds garums, pat ja bārda aug nevienmērīgi. | 2f573e6f |  |
| beard-stubble-short.upkeep.products.0 | trimmer | trimmeris | cb6d339f |  |
| beard-stubble-short.upkeep.products.1 | balm | balzams | 1b7300cd |  |
| beard-stubble-short.client | A light shadow of beard, trimmed every few days. Rugged but tidy and good for patchy growth. | Viegls bārdas ēnojums, ko pielīdzina ik pēc dažām dienām. Vīrišķīgs, bet kopts tēls, kas labi der arī tad, ja bārda aug nevienmērīgi. | 501c0425 |  |
| beard-stubble-short.stylist | Trimmer with a 1-2 mm guard (about #1 on most trimmers), keep the cheek line natural and clean the neck line 2 cm above the Adam's apple. | Lieto trimmeri ar 1–2 mm uzgali (vairumam trimmeru tas ir apmēram 1. numurs), vaigu līniju atstāj dabisku un notīri kakla līniju 2 cm virs Ādama ābola. | 7fa08548 |  |
| beard-stubble-medium.name | Medium stubble | Vidēji rugāji | c73d9d83 |  |
| beard-stubble-medium.growth.note | Needs fairly even growth. | Bārdai jāaug diezgan vienmērīgi. | 2e368fea |  |
| beard-stubble-medium.upkeep.products.0 | trimmer | trimmeris | cb6d339f |  |
| beard-stubble-medium.upkeep.products.1 | beard oil (optional) | bārdas eļļa (pēc izvēles) | 52e31b51 |  |
| beard-stubble-medium.client | A few days beyond a light stubble: short, even and dense, about 3 to 5 mm all over. | Nedaudz vairāk par viegliem rugājiem: īsa, vienmērīga un bieza bārda, viscaur apmēram 3 līdz 5 mm gara. | 7a0f2c72 |  |
| beard-stubble-medium.stylist | Trim to 3-5 mm with a guard, fade the cheek line up into a natural line and clean the neck. Check for gaps on the cheeks. | Ar uzgali apgriez līdz 3–5 mm, sapludini vaigu līniju uz augšu dabiskā pārejā un notīri kaklu. Pārbaudi, vai uz vaigiem nav retāku vietu. | 8108edb8 |  |
| beard-short-boxed.name | Short boxed beard | Short boxed bārda | 05a8293e |  |
| beard-short-boxed.growth.note | Needs fairly even growth. | Bārdai jāaug diezgan vienmērīgi. | 2e368fea |  |
| beard-short-boxed.upkeep.products.0 | beard balm | bārdas balzams | b63b15b1 |  |
| beard-short-boxed.upkeep.products.1 | comb | ķemme | ef4e3f50 |  |
| beard-short-boxed.client | A short, tidy beard about 6 to 12 mm long. It is shaped along the jaw with a clean, low cheek line and a neat neckline. | Īsa, kārtīga bārda apmēram 6 līdz 12 mm garumā. Tā ir veidota gar žokli ar precīzu, zemu vaigu līniju un koptu kakla līniju. | 3a971128 |  |
| beard-short-boxed.stylist | Trim the cheeks and moustache to 6-9 mm and the chin to 9-12 mm; set a low, natural cheek line and a neckline about two fingers above the Adam's apple. | Apgriez vaigus un ūsas līdz 6–9 mm, bet zodu līdz 9–12 mm; iezīmē zemu, dabisku vaigu līniju un kakla līniju apmēram divu pirkstu platumā virs Ādama ābola. | a72020e3 |  |
| beard-full-natural.name | Full beard, natural | Pilna dabiska bārda | e5bbc4ec |  |
| beard-full-natural.growth.note | Needs full coverage on cheeks and chin. | Bārdai pilnībā jānosedz vaigi un zods. | 4640aff1 |  |
| beard-full-natural.upkeep.products.0 | beard oil | bārdas eļļa | 3ab1966d |  |
| beard-full-natural.upkeep.products.1 | balm | balzams | 1b7300cd |  |
| beard-full-natural.upkeep.products.2 | comb | ķemme | ef4e3f50 |  |
| beard-full-natural.client | A full beard of about 2 to 4 cm, kept even and rounded. It has a natural cheek line and a tidy neckline. | Pilna bārda apmēram 2 līdz 4 cm garumā, veidota vienmērīga un noapaļota. Tai ir dabiska vaigu līnija un sakopta kakla līnija. | 7ea1f0c9 |  |
| beard-full-natural.stylist | Shape to an even rounded outline, 2-3 cm on the cheeks and up to 4 cm at the chin; keep the cheek line natural and clean the neck below a line two fingers above the Adam's apple. | Izveido vienmērīgu, noapaļotu formu: 2–3 cm uz vaigiem un līdz 4 cm pie zoda; vaigu līniju atstāj dabisku un notīri kaklu zem līnijas, kas ir divu pirkstu platumā virs Ādama ābola. | 5ce0faa2 |  |
| beard-full-long.name | Long full beard | Gara pilna bārda | ce5732f1 |  |
| beard-full-long.growth.note | Needs full coverage and time. | Nepieciešama bieza bārda un laiks. | c852793e |  |
| beard-full-long.upkeep.products.0 | beard wash | bārdas šampūns | 4410f09f |  |
| beard-full-long.upkeep.products.1 | oil | eļļa | ab7902bc |  |
| beard-full-long.upkeep.products.2 | balm | balzams | 1b7300cd |  |
| beard-full-long.upkeep.products.3 | brush | birste | 029f33c2 |  |
| beard-full-long.client | A long, full beard of several centimetres. A strong, rugged statement that needs regular care. | Gara, bieza bārda vairāku centimetru garumā. Pārliecinošs, vīrišķīgs akcents, kam nepieciešama regulāra kopšana. | d3ba320d |  |
| beard-full-long.stylist | Shape the outline with scissors, shorten the sides slightly and keep the neckline natural. Condition and comb; trim split ends. | Veido kontūru ar šķērēm, nedaudz saīsini sānus un atstāj dabisku kakla līniju. Ieklāj kondicionieri un izķemmē; apgriez šķeltos galus. | ea5ca3da |  |
| beard-garibaldi.name | Garibaldi | Garibaldi | 01628876 | same |
| beard-garibaldi.growth.note | Needs full coverage. | Bārdai jābūt biezai un vienmērīgai. | d30648d4 |  |
| beard-garibaldi.upkeep.products.0 | oil | eļļa | ab7902bc |  |
| beard-garibaldi.upkeep.products.1 | balm | balzams | 1b7300cd |  |
| beard-garibaldi.client | A full, wide beard with a rounded bottom edge. Classic and generous. | Bieza, plata bārda ar noapaļotu apakšējo malu. Klasiska un kupla. | 5cfccefb |  |
| beard-garibaldi.stylist | Round the bottom edge, leave the cheeks natural and blend into the sideburns. Keep the moustache separate from the lip. | Noapaļo apakšējo malu, vaigus atstāj dabiskus un sapludini ar vaigubārdu. Ūsas atdali no lūpas līnijas. | 87058663 |  |
| beard-goatee.name | Goatee | Kazbārdiņa | 3f53cf8a |  |
| beard-goatee.growth.note | Chin growth only. | Bārdai jāaug tikai uz zoda. | e14fc021 |  |
| beard-goatee.upkeep.products.0 | trimmer | trimmeris | cb6d339f |  |
| beard-goatee.upkeep.products.1 | shaving oil | skūšanās eļļa | c1969a65 |  |
| beard-goatee.client | Hair on the chin only, with no moustache and clean-shaven cheeks. | Bārda tikai uz zoda – bez ūsām un ar gludi noskūtiem vaigiem. | c8fb4075 |  |
| beard-goatee.stylist | Keep the chin hair at 5-15 mm and about as wide as the mouth; shave the upper lip, cheeks and neck and keep both sides even. | Matiņus uz zoda atstāj 5–15 mm garus un aptuveni mutes platumā; noskuj augšlūpu, vaigus un kaklu, saglabājot abas puses simetriskas. | a788d5ec |  |
| beard-van-dyke.name | Van Dyke | Van Dyke | cec9b777 | same |
| beard-van-dyke.growth.note | Chin and moustache growth only. | Jāaug tikai ūsām un bārdai uz zoda. | f14b6e8f |  |
| beard-van-dyke.upkeep.products.0 | wax (optional) | vasks (pēc izvēles) | 8f875284 |  |
| beard-van-dyke.upkeep.products.1 | oil | eļļa | ab7902bc |  |
| beard-van-dyke.client | A pointed chin beard and a separate moustache with clean cheeks. A sharp, theatrical look. | Smaila zoda bārdiņa un atsevišķas ūsas ar gludi noskūtiem vaigiem. Spilgts, nedaudz teatrāls tēls. | 8d2d9520 |  |
| beard-van-dyke.stylist | Keep the moustache and chin hair separate with a small gap at the mouth corners, shape the chin to a soft point and shave the cheeks clean. | Ūsas un zoda bārdiņu atstāj atdalītas ar nelielu atstarpi lūpu kaktiņos, zoda daļu veido maigi smailu un gludi noskuj vaigus. | f98043d3 |  |
| beard-balbo.name | Balbo | Balbo | d5a4c1e7 | same |
| beard-balbo.growth.note | Chin, moustache and soul patch. | Jāaug ūsām, bārdai uz zoda un matiņiem zem apakšlūpas. | 4ad04083 |  |
| beard-balbo.upkeep.products.0 | wax | vasks | 57abfafa |  |
| beard-balbo.upkeep.products.1 | trimmer | trimmeris | cb6d339f |  |
| beard-balbo.client | A moustache and a chin beard with a gap between them, plus clean cheeks. Distinctive and crisp. | Ūsas un zoda bārdiņa, kas nav savienotas, ar gludi noskūtiem vaigiem. Pamanāms un izteiksmīgs tēls. | df5a9638 |  |
| beard-balbo.stylist | Keep the moustache wide and separate, shape the chin beard as an inverted rectangle and shave around the mouth corners. | Ūsas veido platas un atdalītas, zoda bārdai piešķir apgriezta taisnstūra formu un noskuj zonu ap mutes kaktiņiem. | 67ce6998 |  |
| beard-chin-strap.name | Chin strap | Chin strap | d0062905 | same |
| beard-chin-strap.growth.note | Even jaw growth. | Bārdai vienmērīgi jāaug gar žokli. | 495afd64 |  |
| beard-chin-strap.upkeep.products.0 | trimmer | trimmeris | cb6d339f |  |
| beard-chin-strap.upkeep.products.1 | razor | skuveklis | 9b4f1d0e |  |
| beard-chin-strap.client | A thin, sharp line of beard that follows the jaw from ear to ear, with no moustache. | Šaura, precīza bārdas līnija gar žokli no auss līdz ausij, bez ūsām. | f0d4d2a4 |  |
| beard-chin-strap.stylist | Keep a narrow band of 3-6 mm along the jawline and 5-10 mm at the chin; razor the cheek and neck edges sharp and shave the moustache. | Saglabā šauru 3–6 mm joslu gar žokļa līniju un 5–10 mm pie zoda; ar skuvekli izveido asas vaigu un kakla kontūras un noskuj ūsas. | fd2fb7df |  |
| beard-anchor.name | Anchor beard | Anchor bārda | 3a13b0f7 |  |
| beard-anchor.growth.note | Chin and jaw growth. | Bārdai jāaug uz zoda un gar žokli. | 67bf3e49 |  |
| beard-anchor.upkeep.products.0 | trimmer | trimmeris | cb6d339f |  |
| beard-anchor.client | A thin line along the jaw that meets a pointed chin patch and a moustache, shaped like an anchor. | Šaura līnija gar žokli, kas savienojas ar smailu zoda bārdas daļu un ūsām, veidojot enkura formu. | 00e59782 |  |
| beard-anchor.stylist | Use a trimmer for the jawline, keep the chin patch pointed and the moustache joined or separate to taste. | Žokļa līnijai izmanto trimmeri, zoda bārdiņu veido smailu, bet ūsas pēc vēlēšanās atstāj savienotas vai atdalītas. | da25a1e9 |  |
| beard-circle.name | Circle beard | Circle bārda | 917412c0 |  |
| beard-circle.growth.note | Chin and moustache growth. | Jāaug ūsām un bārdai uz zoda. | 24278ef4 |  |
| beard-circle.upkeep.products.0 | trimmer | trimmeris | cb6d339f |  |
| beard-circle.client | A moustache and chin hair joined into a ring around the mouth. Neat and compact. | Ūsas un zoda bārda, kas ap muti savienotas vienotā aplī. Kopts un kompakts stils. | 69f0b0e4 |  |
| beard-circle.stylist | Join moustache and chin hair, keep the circle even, round the corners and shave the cheeks. | Savieno ūsas ar zoda bārdiņu, izveido vienmērīgu apli, noapaļo stūrīšus un gludi noskuj vaigus. | fe9e0ff4 |  |
| beard-ducktail.name | Ducktail | Ducktail | 0c765cac | same |
| beard-ducktail.growth.note | Needs full coverage. | Bārdai jābūt biezai un vienmērīgai. | d30648d4 |  |
| beard-ducktail.upkeep.products.0 | oil | eļļa | ab7902bc |  |
| beard-ducktail.upkeep.products.1 | balm | balzams | 1b7300cd |  |
| beard-ducktail.upkeep.products.2 | comb | ķemme | ef4e3f50 |  |
| beard-ducktail.client | A full beard that tapers to a gentle point at the chin. Strong and elegant. | Pilna bārda, kas virzienā uz zodu pakāpeniski sašaurinās vieglā smailē. Spēcīgs un elegants tēls. | 508f517c |  |
| beard-ducktail.stylist | Taper the cheeks and shape the bottom to a soft point, clean the neckline and check for balance. | Pakāpeniski saīsini vaigus un izveido apakšdaļu maigi smailu, notīri kakla līniju un pārbaudi simetriju. | c798e548 |  |
| beard-mustache-only.name | Moustache only | Tikai ūsas | 3a8e7a53 |  |
| beard-mustache-only.growth.note | Upper lip growth. | Ūsām jāaug virs augšlūpas. | 6b70b88a |  |
| beard-mustache-only.upkeep.products.0 | wax | vasks | 57abfafa |  |
| beard-mustache-only.upkeep.products.1 | comb | ķemme | ef4e3f50 |  |
| beard-mustache-only.upkeep.products.2 | scissors | šķēres | 493a15e7 |  |
| beard-mustache-only.client | Hair on the upper lip only. A classic look with its own style. | Apmatojums tikai virs augšlūpas. Klasisks tēls ar savu raksturu. | 606560e9 |  |
| beard-mustache-only.stylist | Trim the lip line, comb downward, shape the edges and keep it a steady width; use wax for handlebar styles. | Nolīdzini lūpu līniju, ķemmē uz leju, ieveido maliņas un saglabā vienmērīgu platumu; uzliektiem ūsu galiem izmanto vasku. | d189e46f |  |
| beard-soul-patch.name | Soul patch | Soul patch | b231d95c | same |
| beard-soul-patch.growth.note | Small chin patch. | Neliels matiņu laukums zem apakšlūpas. | 6b889680 |  |
| beard-soul-patch.upkeep.products.0 | trimmer | trimmeris | cb6d339f |  |
| beard-soul-patch.client | A small patch of hair under the lower lip. Playful and minimal. | Neliels matiņu laukumiņš tieši zem apakšlūpas. Rotaļīgs un minimālistisks akcents. | 8affa374 |  |
| beard-soul-patch.stylist | Define the patch width to the edges of the lip, keep it neat and shave around it. | Iezīmē bārdas saliņas platumu līdz lūpas malām, uzturi to kārtīgu un noskuj visu apkārt. | 408dee01 |  |
| beard-mutton-chops.name | Mutton chops | Mutton chops | ace2223d | same |
| beard-mutton-chops.growth.note | Good sideburn growth. | Labi jāaug vaigubārdai. | 88d61deb |  |
| beard-mutton-chops.upkeep.products.0 | oil | eļļa | ab7902bc |  |
| beard-mutton-chops.upkeep.products.1 | brush | birste | 029f33c2 |  |
| beard-mutton-chops.client | Long sideburns joined to the jaw, with a clean chin. A bold retro look. | Gara vaigubārda, kas savienojas gar žokli, ar gludi noskūtu zodu. Drosmīgs retro tēls. | ad7504d8 |  |
| beard-mutton-chops.stylist | Shape the sideburns as long wedges, shave the chin and trim the moustache. Keep the outline symmetric. | Izveido vaigubārdu kā garus ķīļus, noskuj zodu un apgriez ūsas. Uzturi simetrisku kontūru. | 6da3304b |  |
| beard-faded-full.name | Faded full beard | Faded pilna bārda | f691b262 |  |
| beard-faded-full.growth.note | Needs fairly even growth. | Bārdai jāaug diezgan vienmērīgi. | 2e368fea |  |
| beard-faded-full.upkeep.products.0 | oil | eļļa | ab7902bc |  |
| beard-faded-full.upkeep.products.1 | trimmer | trimmeris | cb6d339f |  |
| beard-faded-full.upkeep.products.2 | balm | balzams | 1b7300cd |  |
| beard-faded-full.client | A full beard that fades from skin on the cheeks and neck to length at the chin. Sharp and modern. | Pilna bārda ar plūstošu fade pāreju no ādas uz vaigiem un kakla līdz garumam pie zoda. Precīzs un mūsdienīgs tēls. | 8a3260b2 |  |
| beard-faded-full.stylist | Fade from skin at the neck and cheeks to 8-12 mm at the chin, blend the sideburn into the head fade and keep the cheek line soft. | Veido fade pāreju no gludas ādas uz kakla un vaigiem līdz 8–12 mm pie zoda, sapludini vaigubārdu ar galvas fade griezumu un saglabā maigu vaigu līniju. | 27d3865c |  |
| icy-platinum.name | Icy platinum blonde | Ledus platīna blonds | 2311fc6b |  |
| icy-platinum.client | A very pale, cool blonde from root to tip with no yellow warmth. It is bright and striking, and it needs regular toning to stay icy. | Ļoti gaišs, vēss blonds tonis no saknēm līdz galiem bez dzeltenā siltuma. Tas ir spilgts un pamanāms, un tam nepieciešama regulāra tonēšana, lai saglabātu ledaino toni. | b8e65100 |  |
| icy-platinum.stylist | Full lightening to a pale, even base, then a violet-blue toner for a cool finish. Plan regrowth care, toner refreshes and bond protection. | Pilnīga balināšana līdz gaišai, vienmērīgai bāzei, pēc tam violeti zils tonētājs vēsam rezultātam. Ieplāno sakņu piekrāsošanu, toņa atsvaidzināšanu un matu saišu (bond) aizsardzību. | 9e00a688 |  |
| platinum-root-shadow.name | Platinum blonde with a soft root shadow | Platīna blonds ar maigu sakņu ēnojumu | aa3ee256 |  |
| platinum-root-shadow.client | Bright platinum lengths with a softly deeper root, so regrowth looks planned and the colour grows out gently. | Spilgti platīna mati visā garumā ar nedaudz tumšākām saknēm, lai ataugums izskatītos pārdomāts un krāsa ataugtu nemanāmi. | d799f389 |  |
| platinum-root-shadow.stylist | Lighten the lengths to a pale base and tone to platinum, then smudge a muted ash-beige root shadow to soften the regrowth line. | Izbalini matus visā garumā līdz gaišai bāzei un notonē platīna tonī, pēc tam pie saknēm iestrādā pieklusinātu pelnu bēšu root shadow, lai mīkstinātu ataugšanas līniju. | c7a7e4e8 |  |
| pearl-blonde-gloss.name | Pearl blonde gloss | Pērļu blonds gloss | 99417b27 |  |
| pearl-blonde-gloss.client | A soft, shiny pearly blonde tone that freshens lighter hair and calms brassy warmth. It leaves a glassy finish. | Maigs, mirdzošs pērļu blonds tonis, kas atsvaidzina gaišus matus un pieklusina dzeltenīgo siltumu. Piešķir matiem spoguļgludu spīdumu. | deb73a88 |  |
| pearl-blonde-gloss.stylist | A toning gloss over hair that is already light, to even the tone and add shine: pearly beige with a faint violet reflect. Refresh the gloss as the tone fades. | Tonējošs gloss jau gaišiem matiem, lai izlīdzinātu toni un piešķirtu spīdumu: pērļu bēšs ar vieglu violetu atspulgu. Atsvaidzini gloss tonējumu, kad tonis sāk izbalēt. | 04efd5ca |  |
| champagne-babylights.name | Champagne babylights | Šampanieša babylights | fa81939a |  |
| champagne-babylights.client | Very fine, creamy champagne lights woven through the hair. They give a soft, sun-kissed glow and grow out easily. | Ļoti smalkas, krēmīgas šampanieša toņa šķipsnas, kas iestrādātas matos. Tās piešķir maigu, saules noskūpstītu mirdzumu un ataug pavisam nemanāmi. | 2fdd201b |  |
| champagne-babylights.stylist | Micro-fine weaves from close to the root through the top and sides, toned to a creamy gold-beige. The base shows between the fine lights, so regrowth is soft. | Mikrosmalkas šķipsniņas no pašām saknēm galvas virspusē un sānos, notonētas krēmīgā zeltaini bēšā tonī. Starp smalkajām šķipsnām ir redzama dabiskā bāze, tāpēc ataugšanas līnija ir maiga. | ecf18a61 |  |
| honey-blonde-foil-highlights.name | Honey blonde foil highlights | Medus blondas folijas šķipsnas | 45655a32 |  |
| honey-blonde-foil-highlights.client | Woven honey-gold highlights that add warm, bright dimension across the whole head. | Iestrādātas medus zelta šķipsnas, kas piešķir siltu, starojošu dziļumu visā matu apjomā. | c5c7d75d |  |
| honey-blonde-foil-highlights.stylist | Foiled weaves from near the root with a softened start, toned to a clear golden honey rather than brass. Suits clients who are happy to keep up root visits. | Folijas tehnikā iestrādātas šķipsnas tuvu saknēm ar maigu pāreju, notonētas tīrā zeltainā medus tonī bez dzeltenuma. Piemērots klientiem, kuri labprāt regulāri nāk piekrāsot saknes. | 11d8f840 |  |
| golden-blonde-foilayage.name | Golden blonde foilayage with a root shadow | Zelta blonds foilayage ar sakņu ēnojumu | c6055cd9 |  |
| golden-blonde-foilayage.client | Painted golden blonde that brightens towards the ends. The softer root lets it grow out gently. | Iekrāsots zelta blonds, kas kļūst gaišāks virzienā uz galiem. Maigāka sakņu zona ļauj krāsai ataugt pakāpeniski un dabiski. | 8284a413 |  |
| golden-blonde-foilayage.stylist | Foilayage gives stronger lift than open-air balayage, with a dark-blonde root smudge to blend the regrowth. Tone to a clear gold, not brass. | Foilayage nodrošina intensīvāku matu izgaismošanu nekā atvērtās tehnikas balayage, ar tumši blondu sakņu sapludināšanu (root smudge), lai sapludinātu ataugšanas līniju. Notonē tīrā zelta tonī, bez dzeltenuma. | e132244e |  |
| ash-blonde-root-shadow.name | Ash blonde with a root shadow | Pelnu blonds ar sakņu ēnojumu | 00c00a81 |  |
| ash-blonde-root-shadow.client | A cool, smoky ash blonde with a deeper root that keeps the colour looking soft and grown-in. | Vēss, dūmakains pelnu blonds ar dziļāku sakņu toni, kas ļauj krāsai izskatīties maigai un dabiski ataugušai. | b3481809 |  |
| ash-blonde-root-shadow.stylist | Lighten to a pale, even base and tone to ash, with a muted dark-blonde root shadow. Ash fades towards warmth, so plan toner refreshes. | Izbalini līdz gaišai, vienmērīgai bāzei un notonē pelnu tonī, pie saknēm veidojot pieklusinātu tumši blondu root shadow. Pelnu toņi izbalējot kļūst siltāki, tāpēc ieplāno toņa atsvaidzināšanu. | 4475fcfb |  |
| vanilla-blonde-sombre.name | Vanilla blonde sombre | Vaniļas blonds sombre | a92ba265 |  |
| vanilla-blonde-sombre.client | A gentle step from your natural root to soft, creamy vanilla blonde at the ends. It looks natural and grows out with little fuss. | Plūstoša pāreja no tavām dabiskajām saknēm uz maigu, krēmīgu vaniļas blondu matu galos. Izskatās dabiski un ataug bez liekām raizēm. | ae4b30a9 |  |
| vanilla-blonde-sombre.stylist | A soft gradient lightening a few levels towards the ends, toned to a warm-neutral cream. Keep the root natural for low upkeep. | Maiga toņu pāreja, par dažiem līmeņiem izgaismojot galus un notonējot silti neitrālā krēma tonī. Saknes atstāj dabiskas, lai uzturēšana prasītu minimālas pūles. | 12ec308c |  |
| strawberry-blonde-balayage.name | Strawberry blonde balayage | Zemeņu blonds balayage | 93005e88 |  |
| strawberry-blonde-balayage.client | Light blonde with a touch of copper-pink warmth, hand-painted through the lengths. | Gaiši blonds tonis ar vieglu vara un sārtu siltumu, kas brīvroku tehnikā iekrāsots matu garumā. | a8c1893b |  |
| strawberry-blonde-balayage.stylist | Hand-painted balayage in a light blonde with copper-pink warmth, heavier at the ends. A gloss keeps the warmth clear; warm tones fade faster. | Brīvroku tehnikā klāts balayage gaiši blondā tonī ar vara rozā siltumu, ar izteiktāku akcentu galos. Gloss tonējums palīdz saglabāt siltā toņa tīrību; siltie toņi izbalē ātrāk. | 2fc86155 |  |
| sandy-blonde-lowlights.name | Sandy blonde lights and lowlights | Smilšu blonds ar gaišām un tumšām šķipsnām | 7ebafd22 |  |
| sandy-blonde-lowlights.client | A natural sandy blonde with fine lighter and deeper strands that give depth without a bold change. | Dabisks smilšu blonds ar smalkām gaišākām un tumšākām šķipsnām, kas piešķir dziļumu bez krasām pārmaiņām. | 8de82cb2 |  |
| sandy-blonde-lowlights.stylist | Fine sandy babylights with a few dark-blonde lowlights between them for depth, in muted, slightly warm tones. Lowlights add depth only on hair that is already dark blonde or lighter; on light brown the person's own colour gives the depth. | Smalkas smilšu toņa babylights šķipsnas ar dažām tumši blondām lowlights šķipsnām starp tām dziļumam, pieklusinātos, viegli siltos toņos. Lowlights piešķir dziļumu tikai matiem, kas jau ir tumši blondi vai gaišāki; gaiši brūniem matiem dziļumu dod paša dabiskā matu krāsa. | 3cc3b78b |  |
| beige-blonde-money-piece.name | Champagne money piece | Šampanieša money piece | 7ae46d45 |  |
| beige-blonde-money-piece.client | Bright, creamy sections at the front frame the face while the rest of your colour stays as it is. | Gaišas, krēmīgas šķipsnas priekšpusē ierāmē seju, kamēr pārējā matu krāsa paliek nemainīga. | e13524b3 |  |
| beige-blonde-money-piece.stylist | Face-framing sections lightened to a creamy champagne beige, heavier at the front and finer behind. A contained service that suits a refresh. | Seju ierāmējošās šķipsnas, kas izgaismotas līdz krēmīgam šampanieša bēšajam tonim – izteiktākas priekšpusē un smalkākas uz aizmuguri. Neliela apjoma pakalpojums, kas lieliski noder tēla atsvaidzināšanai. | 4d4ba4b9 |  |
| bronde-balayage.name | Bronde balayage | Bronde balayage | a947591f | same |
| bronde-balayage.client | A blend of brown and blonde: brown at the root, with soft golden-beige through the lengths. | Brūnā un blondā toņa apvienojums: brūnas saknes ar maigi zeltaini bēšu toni matu garumā. | 6693994d |  |
| bronde-balayage.stylist | Balayage that keeps a brown root and moves through bronde to a soft beige blonde, toned neutral to warm. Gloss to keep it from turning brassy. | Balayage, kas saglabā brūnas saknes un caur bronde toni pāriet maigā bēši blondā, notonētā no neitrāla līdz siltam. Lieto gloss, lai neļautu parādīties nevēlamam dzeltenumam. | 73d181d1 |  |
| mushroom-blonde-melt.name | Mushroom blonde colour melt | Mushroom blonde colour melt | bbd6e58f | same |
| mushroom-blonde-melt.client | A muted, ash-beige colour that melts from a deeper root into a soft grey-toned blonde with no hard lines. | Pieklusināts pelnaini bēšs tonis, kas no tumšākām saknēm bez asām pārejām saplūst ar maigu, pelēcīgu blondu. | 2eaffe21 |  |
| mushroom-blonde-melt.stylist | Lighten the lengths to a pale, even base, then melt a mushroom-brown root into mushroom blonde through the lengths. Cool, muted tones; a gloss helps hold the cool cast. | Izbalini garumus līdz gaišai, vienmērīgai bāzei, pēc tam sapludini mushroom brūno toni pie saknēm ar mushroom blondo matu garumā. Vēsi, pieklusināti toņi; gloss palīdz noturēt vēso nokrāsu. | b49e1e80 |  |
| beige-blonde-colour-correction.name | Beige blonde colour correction | Bēšā blonda krāsas korekcija | a0088308 |  |
| beige-blonde-colour-correction.client | A colourist-led plan for blonde that has turned brassy, patchy or uneven. The aim is an even, soft beige blonde. | Kolorista izstrādāts plāns blondiem matiem, kas kļuvuši dzeltenīgi, pleķaini vai nevienmērīgi. Mērķis ir vienmērīgs, maigs bēšais blonds. | 9802f3a4 |  |
| beige-blonde-colour-correction.stylist | Assessment-led correction towards an even neutral beige blonde, which may involve neutralising or removing earlier colour first. Agree the plan after a strand test. | Korekcija pēc matu stāvokļa novērtēšanas, lai iegūtu vienmērīgu, neitrāli bēšu blondo toni; vispirms var būt nepieciešama iepriekšējās krāsas neitralizēšana vai noņemšana. Par plānu vienojies pēc šķipsnas testa. | fd35a7df | safety; checked |
| chestnut-demi-refresh.name | Chestnut brown refresh | Kastaņbrūnā toņa atsvaidzināšana | 33c47f7b |  |
| chestnut-demi-refresh.client | A tone-on-tone refresh that revives warm chestnut brown and adds shine without a big change. | Toņa atsvaidzināšana tonis tonī, kas atdzīvina silto kastaņbrūno toni un piešķir mirdzumu bez krasām pārmaiņām. | bdea38de |  |
| chestnut-demi-refresh.stylist | A demi-permanent refresh over the whole head or lengths to renew depth and warmth. It fades gradually, without a hard regrowth line. | Demi-permanentā toņa atsvaidzināšana visos matos vai matu garumā, lai atjaunotu dziļumu un siltumu. Krāsa izskalojas pakāpeniski, neradot asu ataugšanas līniju. | 82211b8b |  |
| mocha-soft-babylights.name | Soft caramel-brown babylights | Maigi karameļbrūni babylights | c3cc1e2c |  |
| mocha-soft-babylights.client | Your brown stays rich and natural, with fine caramel strands that catch the light. | Tavs brūnais tonis saglabājas piesātināts un dabisks, ar smalkām karameļu šķipsnām, kas skaisti mirdz gaismā. | 17104886 |  |
| mocha-soft-babylights.stylist | Fine caramel babylights through the top and sides over a natural mocha base. Soft regrowth and low contrast. | Smalkas karameļu toņa babylights šķipsnas virspusē un sānos uz dabiskas mokas bāzes. Maiga ataugšana un neliels kontrasts. | 60dccc89 |  |
| caramel-balayage-chocolate.name | Caramel and golden-brown balayage | Karameļu un zeltaini brūns balayage | 03ede868 |  |
| caramel-balayage-chocolate.client | Warm caramel painted through rich chocolate brown, softly brighter at the ends. | Silti karameļu toņi, kas iestrādāti piesātināti šokolādes brūnos matos un kļūst maigi gaišāki matu galos. | 220120fb |  |
| caramel-balayage-chocolate.stylist | Hand-painted balayage with a soft root, caramel through the mids and a golden brown at the ends. Gloss to keep the warmth glossy. | Ar roku brīvā tehnikā veidots balayage ar maigu sakņu pāreju, karameli vidusdaļā un zeltaini brūnu toni matu galos. Lieto gloss, lai uzturētu siltā toņa mirdzumu. | 9841919d |  |
| espresso-soft-caramel-balayage.name | Soft milk-chocolate and caramel balayage | Maigs piena šokolādes un karameļu balayage | 1e16cc70 |  |
| espresso-soft-caramel-balayage.client | A natural-looking warmth on very dark brown hair, kept soft so the contrast stays gentle. | Dabisks siltums ļoti tumši brūnos matos, veidots maigi, lai kontrasts saglabātos neuzkrītošs. | d70bb627 |  |
| espresso-soft-caramel-balayage.stylist | A restrained lift on a very dark base, aiming for milk chocolate through the mids and a caramel brown at the ends. Keep the root dark and plan toning. | Mērena toņa pacelšana uz ļoti tumšas bāzes ar mērķi iegūt piena šokolādi vidusdaļā un karameļu brūno matu galos. Saknes atstāj tumšas un ieplāno tonēšanu. | b8f62fc4 |  |
| ash-brown-all-over.name | Cool ash brown | Vēss pelnu brūns | f4737ff6 |  |
| ash-brown-all-over.client | A cool, smoky brown for a calm, modern finish. | Vēss, dūmakaini brūns tonis mierīgam un mūsdienīgam koptēlam. | cb0f37dd |  |
| ash-brown-all-over.stylist | An all-over cool brown with a grey-green or blue-violet reflect. Ash fades towards warmth, so a gloss helps hold the tone. | Vēsi brūns tonis visā matu garumā ar pelēcīgi zaļganu vai zili violetu atspulgu. Pelnu toņi izbalējot kļūst siltāki, tāpēc gloss palīdz saglabāt toni. | b831545b |  |
| milk-chocolate-sombre.name | Milk chocolate sombre | Piena šokolādes sombre | 2fe7e9bd |  |
| milk-chocolate-sombre.client | A very soft step from your root to a lighter, warm brown at the ends, with no hard lines. | Ļoti maiga pāreja no saknēm uz gaišāku, silti brūnu toni matu galos bez asām robežām. | ee02d087 |  |
| milk-chocolate-sombre.stylist | A subtle gradient over a warm-neutral brown, lifting the ends a little towards caramel. Low contrast, grows out gently. | Smalki niansēta toņu pāreja uz silti neitrāli brūnas bāzes, nedaudz izgaismojot galus karameles virzienā. Neliels kontrasts, ataug ļoti dabiski un nemanāmi. | 7d617441 |  |
| cinnamon-foilayage.name | Cinnamon brown foilayage | Kanēļbrūns foilayage | 74a50fcc |  |
| cinnamon-foilayage.client | Warm brown with a hint of copper, painted brighter through the ends for a glow in the light. | Silts brūnais tonis ar vieglu vara niansi, kas matu galos iekrāsots gaišāks, lai mirdzētu gaismā. | 60256252 |  |
| cinnamon-foilayage.stylist | Painted and wrapped sections for a little more lift than open balayage, in a warm copper-tinged brown with a golden brown at the ends. | Iekrāsotas un folijā ietītas šķipsnas nedaudz spēcīgākam izgaismojumam nekā ar parasto balayage tehniku – silti brūnā tonī ar vara nokrāsu un zeltaini brūniem galiem. | 1192dbea |  |
| caramel-ombre.name | Caramel to honey ombre | Karameļu un medus ombre | 6440cea6 |  |
| caramel-ombre.client | A clear, graceful fade from a brown root into warm caramel and light honey at the ends. | Skaista, plūstoša pāreja no brūnām saknēm uz siltu karameli un gaišu medus toni matu galos. | c4816f50 |  |
| caramel-ombre.stylist | A defined gradient from the mid-lengths with the natural root zone left, caramel moving to honey at the ends. The ends take the most lightening, so check their condition; a toning gloss keeps the warmth clear. | Izteikta toņu pāreja no matu vidusdaļas, atstājot dabisko sakņu zonu neskartu, kur karamele galos pāriet medus tonī. Mati galos tiek izgaismoti visvairāk, tāpēc pārbaudi to stāvokli; tonējošs gloss palīdz saglabāt siltā toņa tīrību. | 1024479b |  |
| chocolate-caramel-melt.name | Chocolate and caramel colour melt | Šokolādes un karameļu colour melt | 0d3db96c |  |
| chocolate-caramel-melt.client | Brown that moves from deep chocolate to warm caramel in one smooth, soft blend. | Brūns tonis, kas vienmērīgā, maigā pārejā no dziļa šokolādes toņa saplūst ar siltu karameli. | 5c7714d6 |  |
| chocolate-caramel-melt.stylist | Blend a chocolate root through milk chocolate to caramel at the ends. Tones sit close together so the transition is soft. | Sapludini šokolādes toni pie saknēm caur piena šokolādi līdz karamelei matu galos. Toņi ir savstarpēji tuvi, tāpēc pāreja ir ļoti maiga. | 8478a0b9 |  |
| darkest-brown-gloss.name | Deep brown shine gloss | Dziļi brūns mirdzuma gloss | 3b957d51 |  |
| darkest-brown-gloss.client | A rich, glassy gloss that deepens very dark brown and brings out its shine. | Piesātināts, spoguļgluds gloss, kas piešķir ļoti tumši brūniem matiem dziļumu un izceļ to spīdumu. | f766c42c |  |
| darkest-brown-gloss.stylist | A clear or tinted gloss to even the tone and add reflect on very dark brown hair. A simple colour refresh with little change in shade. | Caurspīdīgs vai tonēts gloss, lai izlīdzinātu toni un piešķirtu atspulgu ļoti tumši brūniem matiem. Vienkārša krāsas atsvaidzināšana bez būtiskas toņa maiņas. | 1332299b |  |
| chocolate-colour-correction.name | Chocolate brown colour correction | Šokolādes brūnā toņa krāsas korekcija | 13de8c00 |  |
| chocolate-colour-correction.client | A colourist-led plan for patchy, banded or off-tone dyed hair. The aim is an even, rich brown. | Kolorista izstrādāts plāns krāsotiem matiem ar pleķiem, krāsas joslām vai nevēlamu nokrāsu. Mērķis ir vienmērīgs, piesātināti brūns tonis. | bc728e86 |  |
| chocolate-colour-correction.stylist | Assessment-led correction towards an even chocolate brown, which may involve removing earlier colour, pre-filling lighter or porous sections, or neutralising tone first. Agree the plan after a strand test. | Korekcija pēc matu stāvokļa novērtēšanas, lai iegūtu vienmērīgu šokolādes brūno toni; vispirms var būt nepieciešama iepriekšējās krāsas noņemšana, gaišāku vai porainu zonu iepriekšēja pigmentēšana vai toņa neitralizēšana. Par plānu vienojies pēc šķipsnas testa. | ddaf789a | safety; checked |
| copper-balayage-root-shadow.name | Copper balayage with a root shadow | Vara balayage ar sakņu ēnojumu | 124e1c5c |  |
| copper-balayage-root-shadow.client | A warm copper that glows through the lengths, over a soft brown root so it grows out gently. | Silts vara tonis, kas mirdz matu garumā virs maigi brūnām saknēm, ļaujot krāsai ataugt nemanāmi. | 1bea7eef |  |
| copper-balayage-root-shadow.stylist | A chestnut root shadow with balayage moving from auburn through the mids to a brighter copper at the ends. Copper fades fast, so plan glosses. | Kastaņbrūns root shadow pie saknēm ar balayage pāreju no sarkanbrūna toņa vidusdaļā līdz košākam vara tonim matu galos. Vara toņi ātri izbalē, tāpēc ieplāno gloss procedūras. | 177a22ae |  |
| auburn-all-over.name | Auburn all over | Kastaņrudais tonis visā garumā | c3e4d32c |  |
| auburn-all-over.client | A rich brown with a clear red warmth, even from root to tip. | Piesātināts brūns tonis ar izteiktu sarkanīgu siltumu, vienmērīgs no saknēm līdz galiem. | cd62b23c |  |
| auburn-all-over.stylist | An all-over auburn at a brown level, warm and slightly red. Red-leaning tones fade faster, so a gloss helps the shine. | Vienmērīgs sarkanbrūns (auburn) tonis visā matu garumā brūno toņu līmenī, silts un ar vieglu sarkanu nokrāsu. Toņi ar sarkanīgu nokrāsu izbalē ātrāk, tāpēc gloss palīdz uzturēt spīdumu. | dee53c9f |  |
| copper-all-over.name | Copper all over | Vara tonis visā garumā | c2a3d4d5 |  |
| copper-all-over.client | A bright, warm orange-red copper from root to ends. | Spilgts, silts, oranžsarkans vara tonis no saknēm līdz pašiem galiem. | 8e8f09d4 |  |
| copper-all-over.stylist | An all-over bright copper. On natural hair near a copper level the colour lifts and tones together; earlier dye needs its own plan, because colour does not lift colour. It fades quickly, so plan gloss visits and gentle care. | Spilgts vara tonis visā matu garumā. Dabiskiem matiem, kas ir tuvu vara līmenim, krāsa reizē izgaismo un tonē; iepriekš krāsotiem matiem nepieciešams atsevišķs plāns, jo krāsa krāsu nepadara gaišāku. Šis tonis ātri izskalojas, tāpēc ieplāno gloss procedūru apmeklējumus un saudzīgu kopšanu. | d83e0903 |  |
| ginger-balayage.name | Ginger balayage | Rudais balayage | 3c6de2f5 |  |
| ginger-balayage.client | Golden-orange ginger painted softly through the lengths, bright at the ends. | Zeltaini oranžs rudais tonis, kas maigi iekrāsots matu garumā un kļūst košs matu galos. | 7419274a |  |
| ginger-balayage.stylist | Balayage from copper through the mids to a light golden-orange ginger at the ends, with the natural root left. It needs lightening and warm tones fade, so plan glosses. | Balayage no vara toņa vidusdaļā līdz gaiši zeltaini oranžam rudajam tonim matu galos, atstājot dabiskas saknes. Nepieciešama izgaismošana, un siltie toņi ātri izbalē, tāpēc ieplāno gloss procedūras. | b8975c81 |  |
| cherry-cola-gloss.name | Cherry cola gloss | Cherry cola gloss | 6bb29f76 | same |
| cherry-cola-gloss.client | A dark brown with a flash of cherry red that shows in the light. | Tumši brūns tonis ar ķiršsarkanu atspulgu, kas iemirdzas gaismā. | 827744bb |  |
| cherry-cola-gloss.stylist | A tinted gloss to add cherry-red reflect to a dark brown base. Subtle indoors, richer in sunlight. Refresh as it fades. | Tonēts gloss, lai piešķirtu ķiršsarkanu atspulgu tumši brūnai bāzei. Telpās tas izskatās maigs, bet saules gaismā kļūst izteiksmīgāks un piesātinātāks. Atsvaidzini, kad tonis izbalē. | 6107292e |  |
| mahogany-demi-refresh.name | Mahogany refresh | Mahagonija toņa atsvaidzināšana | d5bf2d97 |  |
| mahogany-demi-refresh.client | A deep brown with a red-violet depth, refreshed so it looks rich and glossy. | Dziļi brūns tonis ar sarkanīgi violetu dziļumu, atsvaidzināts, lai izskatītos piesātināts un mirdzošs. | e48c2f47 |  |
| mahogany-demi-refresh.stylist | A demi-permanent refresh to renew a red-violet brown. Depth and shine with a gentle fade and no hard regrowth line. | Demi-permanentā toņa atsvaidzināšana, lai atjaunotu sarkanīgi violeto brūno toni. Dziļums un spīdums ar vienmērīgu toņa izskalošanos un bez asas ataugšanas līnijas. | 6811baec |  |
| auburn-money-piece.name | Copper money piece | Vara toņa money piece | 2001c093 |  |
| auburn-money-piece.client | Your auburn stays as it is, with brighter copper sections at the front that frame the face. | Tavs kastaņrudais tonis paliek nemainīgs, bet gaišākas vara šķipsnas priekšpusē ierāmē seju. | 9089fda3 |  |
| auburn-money-piece.stylist | Face-framing sections lightened to copper over an auburn base, heavier at the front. Gloss keeps the brightness from fading. | Seju ierāmējošās šķipsnas, kas izgaismotas līdz vara tonim uz sarkanbrūnas bāzes, ar lielāku akcentu priekšpusē. Gloss procedūra neļauj spilgtumam izbalēt. | 0b3a2272 |  |
| copper-ombre.name | Copper ombre | Vara ombre | 09c45b8a |  |
| copper-ombre.client | A graceful fade from auburn into bright copper at the ends. | Eleganta pāreja no kastaņrudā toņa uz košu vara toni matu galos. | 1bbdd04f |  |
| copper-ombre.stylist | A defined gradient from the mid-lengths, auburn moving to copper. The natural root zone stays, so regrowth is easy. | Izteikta toņu pāreja no matu vidusdaļas: sarkanbrūnais tonis pakāpeniski pāriet vara tonī. Dabisko sakņu zonu saglabā, tāpēc ataugšana nesagādā rūpes. | 0197e116 |  |
| copper-colour-melt.name | Auburn to ginger colour melt | Colour melt no kastaņruda uz rudu | bf0ce0b0 |  |
| copper-colour-melt.client | Warm tones that melt from auburn through copper to a light ginger in one smooth blend. | Silti toņi, kas vienmērīgā pārejā plūst no kastaņruda caur vara toni līdz gaiši rudam. | e2972b77 |  |
| copper-colour-melt.stylist | Blend auburn at the root into copper mids and ginger ends, with no demarcation. Warm tones fade fast, so plan glosses. | Sapludini sarkanbrūno toni pie saknēm ar vara toni vidusdaļā un rudiem galiem bez asām pārejas līnijām. Siltie toņi ātri izbalē, tāpēc ieplāno gloss procedūras. | 6a033282 |  |
| soft-black-gloss.name | Soft black shine gloss | Maigi melns spīduma gloss | bec073c3 |  |
| soft-black-gloss.client | A deep, soft black with a glassy finish that gives dark hair real shine. | Dziļš, maigi melns tonis ar spoguļgludu mirdzumu, kas tumšiem matiem piešķir patiesu spīdumu. | af13887f |  |
| soft-black-gloss.stylist | A gloss over black or very dark hair to even the tone and add reflect. Neutral to slightly warm black with no lightening. | Gloss melniem vai ļoti tumšiem matiem toņa izlīdzināšanai un atspulgam. Neitrāls līdz viegli silts melnais tonis bez matu izgaismošanas. | a3ad2fd8 |  |
| jet-black-all-over.name | Jet black all over | Piķa melns visā garumā | cc4bef26 |  |
| jet-black-all-over.client | A solid, cool jet black from root to ends. It is a long-term choice, because black is hard to lighten later. | Viendabīgs, vēss piķa melns tonis no saknēm līdz galiem. Tā ir ilgtermiņa izvēle, jo vēlāk melnu krāsu ir grūti padarīt gaišāku. | 034972d4 |  |
| jet-black-all-over.stylist | An all-over cool jet black. A strong colour that is hard to lighten later, so confirm the long-term plan first. | Vēss ogļu melns tonis visā matu garumā. Intensīva krāsa, ko vēlāk būs grūti izbalināt, tāpēc vispirms vienojies par ilgtermiņa plānu. | 3b5ba395 |  |
| black-brown-money-piece.name | Mocha money piece | Mokas toņa money piece | ce5e9d2e |  |
| black-brown-money-piece.client | Soft black hair with a lighter mocha brown around the face to brighten it gently. | Maigi melni mati ar gaišāku mokas brūno toni ap seju, lai to maigi izgaismotu. | ce46257e |  |
| black-brown-money-piece.stylist | Face-framing sections lifted to a mocha brown over natural black, heavier at the front. A restrained contrast that suits dark hair; lifting dyed black is a correction and needs its own plan. | Seju ierāmējošas šķipsnas, kas uz dabiskas melnas bāzes izgaismotas līdz mokas brūnam tonim, ar izteiktāku akcentu priekšpusē. Gaumīgs kontrasts, kas piestāv tumšiem matiem; krāsotu melnu matu izgaismošana ir krāsas korekcija un prasa atsevišķu plānu. | c8c3bebd |  |
| black-burgundy-melt.name | Black to burgundy colour melt | Colour melt no melna uz bordo | 21c50e56 |  |
| black-burgundy-melt.client | Black at the root that deepens into a dark, rich wine tone at the ends, subtle until it catches the light. | Melns tonis pie saknēm, kas virzienā uz galiem pārtop piesātinātā, tumša vīna tonī — neuzkrītošs, līdz tajā iespīd gaisma. | eec2f6a8 |  |
| black-burgundy-melt.stylist | Melt a soft black root through a dark cherry to a deep burgundy at the ends. Dark enough to stay wearable, with a red-violet sheen. | Sapludini maigi melno toni pie saknēm caur tumšu ķiršu toni līdz dziļam bordo matu galos. Pietiekami tumšs un ērts ikdienai, ar sarkanīgi violetu spīdumu. | 7401bd8e |  |
| silver-white-all-over.name | Silver white | Sudrabbalts | d90266d0 |  |
| silver-white-all-over.client | A cool, bright white-silver from root to tip. The hair is lightened to its palest first, and it needs regular toning to stay silver. | Vēss, dzidrs sudrabbalts tonis no saknēm līdz galiem. Vispirms mati tiek padarīti maksimāli gaiši, un tiem nepieciešama regulāra tonēšana, lai saglabātu sudraboto toni. | a3fcd4f5 |  |
| silver-white-all-over.stylist | Full lightening to a very pale base, then a cool silver toner. High upkeep: plan regrowth care, toner refreshes and bond protection. | Pilna balināšana līdz ļoti gaišai bāzei, kam seko vēss sudraba toneris. Prasīga uzturēšana: ieplāno sakņu piekrāsošanu, toņa atsvaidzināšanu un matu saišu aizsardzību (bond protection). | 29605d6b |  |
| charcoal-grey-all-over.name | Charcoal grey | Ogļu pelēks | 67018e69 |  |
| charcoal-grey-all-over.client | A dark, cool grey with a smoky, modern depth. | Tumšs, vēss pelēks tonis ar dūmakainu, mūsdienīgu dziļumu. | 78b2310c |  |
| charcoal-grey-all-over.stylist | Lighten to a pale enough base that the grey reads as grey rather than ash brown, then deposit a dark cool-neutral grey. Grey tones fade and warm up, so plan toning. | Izbalini matus līdz pietiekami gaišai bāzei, lai pelēkais izskatītos patiesi pelēks, nevis pelnu brūns, un pēc tam ieklāj tumšu, vēsi neitrālu pelēko toni. Pelēkie toņi izmazgājas un kļūst siltāki, tāpēc ieplāno tonēšanu. | 97bafe85 |  |
| grey-blend-blonde.name | Grey blending with blonde | Sirmo matu iepludināšana ar blondo toni | 9ae234eb |  |
| grey-blend-blonde.client | Soft blonde lights and deeper strands that merge with your natural grey. Regrowth shows less, and the grey looks planned. | Maigi blondi akcenti un tumšākas šķipsnas, kas saplūst ar taviem dabiskajiem sirmajiem matiem. Ataugusī daļa ir mazāk pamanāma, un sirmie mati izskatās kā pārdomāts stils. | ca3d07fa |  |
| grey-blend-blonde.stylist | Fine lights and dark-blonde lowlights around the root zone and through the surface to blend natural grey. Low-contrast and suits longer gaps between visits. | Smalkas gaišās un tumši blondās šķipsnas (lowlights) sakņu zonā un matu virspusē, lai sapludinātu dabisko sirmumu. Maigs kontrasts, kas ļauj retāk apmeklēt salonu. | 9b34aad3 |  |
| grey-blend-brunette.name | Grey blending with brown | Sirmo matu iepludināšana ar brūno toni | 88706a3d |  |
| grey-blend-brunette.client | Brown strands and soft lights that blend with your natural grey for a lived-in look and an easy grow-out. | Brūnas šķipsnas un maigi gaiši akcenti, kas saplūst ar taviem dabiskajiem sirmajiem matiem, radot nepiespiestu tēlu un atvieglojot matu ataugšanu. | 5e2877f9 |  |
| grey-blend-brunette.stylist | Brown lowlights and lights that merge with the grey, instead of covering it. Reduces the contrast at the root and suits a gradual approach. | Brūnas tumšās un gaišās šķipsnas, kas saplūst ar sirmumu, nevis to pilnībā noklāj. Tas samazina kontrastu pie saknēm un lieliski der pakāpeniskai pārejai. | 6c34d9ae |  |
| natural-silver-gloss.name | Natural silver with a toning gloss | Dabisks sudrabs ar tonējošu gloss | 56b83b9a |  |
| natural-silver-gloss.client | Your natural grey and white, with a clear, silvery shine that softens yellow tones. | Tavi dabiskie sirmie un baltie mati ar dzidru, sudrabotu mirdzumu, kas pieklusina dzeltenīgos toņus. | 1a2750fe |  |
| natural-silver-gloss.stylist | A toning gloss over natural grey and white hair to remove yellow and add shine. A good finish for a grey grow-out. | Tonējošs glosings dabīgi sirmiem un baltiem matiem, lai noņemtu dzelteno toni un piešķirtu spīdumu. Lielisks risinājums, ataudzējot sirmus matus. | c15a3a65 |  |
| silver-babylights-blend.name | Silver-white babylights | Sudrabaini balti babylights | 102a3116 |  |
| silver-babylights-blend.client | Fine silver lights that blend with your natural grey for a soft, sparkling finish while you grow it out. | Smalkas sudrabotas šķipsnas, kas saplūst ar taviem dabiskajiem sirmajiem matiem, piešķirot maigu, mirdzošu akcentu, kamēr ataudzē dabisko toni. | c905f438 |  |
| silver-babylights-blend.stylist | Fine silver babylights through a natural grey base to even out the pattern of white and grey, then a cool toner. | Smalkas sudraba babylights šķipsnas dabīgi sirmā bāzē, lai izlīdzinātu balto un sirmo matu pārejas, kam seko vēss toneris. | 4e99261d |  |
| grey-coverage-light-brown.name | Light brown grey coverage | Gaiši brūns sirmo matu nokrāsošanai | c032cde7 |  |
| grey-coverage-light-brown.client | A natural-looking light brown chosen to cover grey from root to tip. Very resistant grey can need extra steps. | Dabisks gaiši brūns tonis, kas izvēlēts, lai nokrāsotu sirmos matus no saknēm līdz galiem. Ļoti noturīgiem sirmiem matiem var būt nepieciešami papildu soļi. | ab29cf1f |  |
| grey-coverage-light-brown.stylist | Permanent colour to cover grey in a neutral light brown, with the roots refreshed at each visit. A neutral shade gives the most even result. | Noturīga krāsa sirmuma noklāšanai neitrāli gaiši brūnā tonī, katrā vizītē piekrāsojot saknes. Neitrāls tonis nodrošina visvienmērīgāko rezultātu. | c9eb94da |  |
| grey-coverage-chocolate.name | Chocolate brown grey coverage | Šokolādes brūns sirmo matu nokrāsošanai | 921c886e |  |
| grey-coverage-chocolate.client | A rich, warm chocolate brown chosen to cover grey evenly. | Piesātināts, silts šokolādes brūnais tonis, kas izvēlēts, lai vienmērīgi nokrāsotu sirmos matus. | 04d9b54a |  |
| grey-coverage-chocolate.stylist | Permanent colour to cover grey in a rich neutral-warm chocolate brown, with root touch-ups. Ensure the lengths are refreshed with care. | Noturīga krāsa sirmuma noklāšanai piesātinātā, neitrāli siltā šokolādes brūnā tonī ar sakņu piekrāsošanu. Garumus noteikti atsvaidzini saudzīgi. | d38b1413 |  |
| grey-coverage-soft-black.name | Soft black grey coverage | Maigi melns sirmo matu nokrāsošanai | f9d162c3 |  |
| grey-coverage-soft-black.client | A soft, natural black chosen to cover grey evenly. | Maigs, dabiski melns tonis, kas izvēlēts, lai vienmērīgi nokrāsotu sirmos matus. | d8e43bad |  |
| grey-coverage-soft-black.stylist | Permanent colour to cover grey in a soft black. Regrowth shows more on dark hair, so plan root visits. | Noturīga krāsa sirmuma noklāšanai maigi melnā tonī. Uz tumšiem matiem ataugušās saknes izceļas vairāk, tāpēc laikus ieplāno sakņu krāsošanu. | fa443278 |  |
| pastel-pink-all-over.name | Pastel pink | Pasteļrozā | b9b33320 |  |
| pastel-pink-all-over.client | A soft, candy pink all over on very light hair. It is a bold change that needs regular touch-ups. | Maigs konfekšu rozā tonis visos matos uz ļoti gaišas bāzes. Tās ir drosmīgas pārmaiņas, kam nepieciešama regulāra toņa atjaunošana. | 6b2ba067 |  |
| pastel-pink-all-over.stylist | Pastel pink over a fully lightened base. Pastels fade quickly, so plan colour-safe care and refreshes. | Pasteļrozā tonis uz pilnībā izbalinātas bāzes. Pasteļtoņi ātri izmazgājas, tāpēc ieplāno krāsu saudzējošu kopšanu un toņa atsvaidzināšanu. | ac58fb37 |  |
| rose-gold-all-over.name | Rose gold | Rozā zelts | 1777f09f |  |
| rose-gold-all-over.client | A blonde with a warm copper-pink glow, soft rather than bright. | Blonds tonis ar siltu vara un rozā mirdzumu — drīzāk maigs, nevis košs. | 6a3499cf |  |
| rose-gold-all-over.stylist | A copper-pink gloss over a lifted blonde base. Fades towards a soft blonde, so plan refreshes. | Vara rozā glosings uz gaišinātas blondas bāzes. Izmazgājas līdz maigi blondam tonim, tāpēc ieplāno toņa atsvaidzināšanu. | 6881b2ff |  |
| lavender-all-over.name | Lavender | Lavanda | 60707cfe |  |
| lavender-all-over.client | A soft violet-lilac across the whole head on very light hair. | Maigs ceriņviolets tonis visos matos uz ļoti gaišas bāzes. | 743ef553 |  |
| lavender-all-over.stylist | A pastel violet over a fully lightened base. Pastels fade quickly, so plan colour-safe care and refreshes. | Pasteļviolets tonis uz pilnībā izbalinātas bāzes. Pasteļtoņi ātri izmazgājas, tāpēc ieplāno krāsu saudzējošu kopšanu un toņa atsvaidzināšanu. | 0dca6f21 |  |
| teal-all-over.name | Teal | Zilganzaļš | fa15a5c1 |  |
| teal-all-over.client | A saturated blue-green all over, bold and bright. | Piesātināts zilganzaļš tonis visos matos — drosmīgs un košs. | 3521be89 |  |
| teal-all-over.stylist | A saturated teal over a lifted base. Blue-greens are strong when new, fade to a lighter aqua and can stain lightened hair, so plan how it will be removed or covered later. | Piesātināts zilganzaļš tonis uz gaišinātas bāzes. Zilganzaļie toņi sākumā ir intensīvi, izmazgājas par gaišu akvamarīnu un var ieēsties balinātos matos, tāpēc laikus ieplāno, kā to vēlāk izņemsi vai pārkrāsosi. | 6b800c9a |  |
| cherry-red-all-over.name | Cherry red | Ķiršsarkans | 8a2347b7 |  |
| cherry-red-all-over.client | A saturated, blue-toned red from root to ends. | Piesātināts sarkans tonis ar vēsu, zilganu apakštoni no saknēm līdz galiem. | 23d1df38 |  |
| cherry-red-all-over.stylist | A cool, saturated red over a lifted base. Reds fade quickly and stain, so plan colour-safe care. | Vēss, piesātināts sarkans tonis uz gaišinātas bāzes. Sarkanie toņi ātri izmazgājas un var ieēsties matos, tāpēc ieplāno krāsu saudzējošu kopšanu. | 34406c3c |  |
| midnight-blue-all-over.name | Midnight blue | Pusnakts zils | 0b31ed2a |  |
| midnight-blue-all-over.client | A very dark blue that reads as near-black indoors and shows blue in daylight. | Ļoti tumši zils tonis, kas iekštelpās izskatās teju melns, bet dienasgaismā atklāj zilu nokrāsu. | 4a666b1a |  |
| midnight-blue-all-over.stylist | A deep blue over a base lightened enough for the blue to read; the warmth left in darker hair turns blue towards brown-black. Subtle and wearable, with a shift of colour in the light. | Dziļi zils tonis uz bāzes, kas izbalināta pietiekami, lai zilais izceltos; matos palikušais siltais pigments zilo padara brūngani melnu. Smalks un viegli nēsājams tonis, kas gaismā skaisti maina nokrāsu. | 8a1e8f70 |  |
| peach-apricot-all-over.name | Peach apricot | Persiku un aprikožu tonis | 796855ef |  |
| peach-apricot-all-over.client | A soft peach-orange pastel across the whole head. | Maigs persiku oranžs pasteļtonis visos matos. | 95388645 |  |
| peach-apricot-all-over.stylist | A pastel peach over a pale, evenly lightened base; the last trace of warmth suits peach. Pastels fade fast, so plan refreshes and colour-safe care. | Pasteļpersiku tonis uz gaišas, vienmērīgi izbalinātas bāzes; pēdējā siltuma atblāzma persiku tonim nāk tikai par labu. Pasteļtoņi ātri izmazgājas, tāpēc ieplāno toņa atsvaidzināšanu un krāsu saudzējošu kopšanu. | b93884fe |  |
| plum-violet-all-over.name | Plum violet | Plūmju violetais | fe78e7d3 |  |
| plum-violet-all-over.client | A rich purple-plum from root to ends. | Piesātināts purpura plūmju tonis no saknēm līdz galiem. | 1f436a90 |  |
| plum-violet-all-over.stylist | A saturated plum over a base lightened enough for the violet to read; on a darker, warmer base it turns red-brown. Violet fades towards a muted purple, so plan glosses. | Piesātināts plūmju tonis uz bāzes, kas izbalināta pietiekami, lai violetais tonis izceltos; uz tumšākas, siltākas bāzes tas kļūst sarkanbrūns. Violetais izmazgājas par pieklusinātu purpura toni, tāpēc ieplāno glosingu. | 8301a1c6 |  |
| plum-ombre-ends.name | Plum ombre ends | Plūmju ombre matu galos | 480f54f4 |  |
| plum-ombre-ends.client | Your natural roots fade into rich plum at the ends. It is a bold colour that is easy to wear. | Tavas dabiskās saknes pakāpeniski pāriet piesātinātā plūmju tonī matu galos. Drosmīga krāsa, ko ir viegli nēsāt. | 84c3d314 |  |
| plum-ombre-ends.stylist | An ombre that keeps the natural root zone and lifts the lengths to carry a saturated plum at the ends. Grows out without a visible line. | Ombre, kurā saglabāta dabiskā sakņu zona un gaišināti garumi, lai galos ieklātu piesātinātu plūmju toni. Mati ataug bez pamanāmas robežlīnijas. | ffac6cce |  |
| peachy-rose-melt.name | Peach and rose gold colour melt | Persiku un rozā zelta colour melt | fc1b4e7a |  |
| peachy-rose-melt.client | A soft glow that melts from warm blonde through rose gold to peach at the ends. | Maigs mirdzums, kas vienmērīgi pāriet no silta blonda toņa caur rozā zeltu līdz persiku tonim matu galos. | 30f808dd |  |
| peachy-rose-melt.stylist | Melt a strawberry blonde root into rose gold and peach ends over a lightened base. Pastel pink-orange tones fade fast, so plan refreshes. | Plūstoša pāreja no zemeņu blondām saknēm uz rozā zelta un persiku toņa galiem uz balinātas bāzes. Pasteļrozā un oranžie toņi ātri izmazgājas, tāpēc ieplāno toņa atsvaidzināšanu. | a494e218 |  |
| lavender-ombre-blonde.name | Lavender ombre on blonde | Lavandas ombre uz blondiem matiem | 0eff8e3e |  |
| lavender-ombre-blonde.client | Cool blonde that softly fades into lavender at the ends. | Vēss blonds tonis, kas matu galos maigi pāriet lavandas tonī. | ea02dfe4 |  |
| lavender-ombre-blonde.stylist | An ombre from ash blonde to a pastel lavender at the ends over lightened lengths. Pastels fade fast, so plan refreshes. | Ombre no pelnu blonda toņa līdz pasteļlavandas galiem uz gaišinātiem garumiem. Pasteļtoņi ātri izmazgājas, tāpēc ieplāno toņa atsvaidzināšanu. | 61675fad |  |
| grey-blend-short-brown-men.name | Grey blending for short hair | Sirmo matu sapludināšana īsiem matiem | d3ee36e7 |  |
| grey-blend-short-brown-men.client | Soft light and deeper brown strands that blend with your grey on short hair, so the grey looks natural rather than covered. | Maigi gaišas un tumšākas brūnas šķipsnas, kas īsos matos saplūst ar tavu sirmumu, lai tas izskatītos dabiski, nevis vienkārši nokrāsots. | 66b71682 |  |
| grey-blend-short-brown-men.stylist | Fine lights and lowlights through the top, and through the sides where the hair is long enough to weave, blending the grey instead of covering it. Low-contrast and easy to grow out. | Smalkas gaišās un tumšās šķipsnas virsdaļā un sānos, kur matu garums to atļauj, sapludinot sirmumu, nevis to pilnībā noklājot. Neuzkrītošs kontrasts un nemanāma ataugšana. | 8bc11952 |  |
| grey-coverage-brown-men.name | Natural brown grey coverage | Dabiski brūns sirmo matu nokrāsošanai | 065ee203 |  |
| grey-coverage-brown-men.client | A natural, even brown chosen to cover grey on short hair. | Dabisks, vienmērīgs brūns tonis, kas izvēlēts, lai nokrāsotu sirmumu īsos matos. | 862719a8 |  |
| grey-coverage-brown-men.stylist | Permanent colour in a neutral brown to cover grey, with regular root touch-ups. A neutral shade reads most naturally on a short cut. | Noturīga krāsa neitrāli brūnā tonī sirmuma noklāšanai ar regulāru sakņu piekrāsošanu. Neitrāls tonis īsā griezumā izskatās visdabiskāk. | 77c09196 |  |
| grey-coverage-black-men.name | Soft black grey coverage for short hair | Maigi melns sirmo matu nokrāsošanai īsiem matiem | 8f6065dc |  |
| grey-coverage-black-men.client | A soft, natural black chosen to cover grey evenly on short hair. | Maigs, dabiski melns tonis, kas izvēlēts, lai vienmērīgi nokrāsotu sirmumu īsos matos. | c2dfdd20 |  |
| grey-coverage-black-men.stylist | Permanent colour to cover grey in a soft black; a shade a little softer than the original natural colour keeps it from looking flat. Regrowth shows sooner on short dark hair, so plan root visits. | Noturīga krāsa sirmuma noklāšanai maigi melnā tonī; nedaudz maigāks tonis par sākotnējo dabisko krāsu neļauj tonim izskatīties plakanam. Īsos, tumšos matos ataugušās saknes ir pamanāmas ātrāk, tāpēc ieplāno regulāru sakņu piekrāsošanu. | 8aaa5445 |  |
| grey-blend-translucent-men.name | Translucent grey blend | Puscaurspīdīga sirmo matu iepludināšana | 3f0592ef |  |
| grey-blend-translucent-men.client | A see-through brown tone that softens grey instead of covering it. Some grey still shows and regrowth stays gentle. | Caurspīdīgs brūns tonis, kas padara sirmos matus maigākus, nevis tos pilnībā nokrāso. Daļa sirmuma joprojām ir redzama, un ataugšana ir neuzkrītoša. | 8020c14b |  |
| grey-blend-translucent-men.stylist | A translucent deposit over the whole head that tones down grey without full coverage, leaving a natural salt-and-pepper. Choose a shade at or a little lighter than the natural brown so it does not look flat. | Puscaurspīdīgs tonējums visiem matiem, kas pieklusina sirmumu bez pilnīgas noklāšanas, saglabājot dabisku «sāls un pipari» efektu. Izvēlies toni dabīgā brūnā līmenī vai nedaudz gaišāku, lai rezultāts neizskatītos plakans. | 2bf3da8c |  |
| platinum-blonde-men.name | Bright platinum blonde | Spilgts platīnblonds | e4841294 |  |
| platinum-blonde-men.client | A bright, near-white blonde across the whole head. It is a big change that needs regular toning and root visits to stay clean. | Spilgts, gandrīz balts blonds tonis visos matos. Tās ir lielas pārmaiņas, kam nepieciešama regulāra tonēšana un sakņu piekrāsošana salonā, lai tonis saglabātos tīrs. | 4d529ad5 |  |
| platinum-blonde-men.stylist | Full lightening to a pale, even base, then a toner for a clean platinum. On short hair the lightener sits on the scalp, so check the scalp first, and plan regrowth care and bond protection. | Pilna matu balināšana līdz gaišai, vienmērīgai bāzei, kam seko toneris tīram platīna tonim. Īsos matos balinātājs skar galvas ādu, tāpēc vispirms novērtē galvas ādas stāvokli un ieplāno ataugušo sakņu kopšanu un matu saišu aizsardzību (bond protection). | 38055880 |  |
| caramel-tips-men.name | Caramel tips | Karameļu galiņi | aa49e48c |  |
| caramel-tips-men.client | A lighter caramel finish on the tips of the top, with the sides left natural. | Gaišāks karameļu akcents matu galos virspusē, sānus atstājot dabiskus. | a4706100 |  |
| caramel-tips-men.stylist | Painted caramel on the ends of the top section only, with the sides left natural. Soft grow-out; suits a textured cut. | Ar otu iestrādāts karameles tonis tikai virsdaļas matu galos, sānus atstājot dabiskus. Maiga ataugšana; piestāv teksturētam griezumam. | 98e674f8 |  |
| sandy-tips-crop-men.name | Sandy blonde tips | Smilšu blondie galiņi | bc72c643 |  |
| sandy-tips-crop-men.client | Sandy blonde tips on the top, with the sides and roots left natural for a lived-in contrast. | Smilšu blondi galiņi matu augšdaļā, saglabājot dabiskas saknes un sānus nepiespiestam kontrastam. | cee0df16 |  |
| sandy-tips-crop-men.stylist | Painted and wrapped sections on the top tips for stronger lift, in a muted sandy blonde. Leave the sides natural and tone to avoid brass. | Iekrāsotas un ietītas šķipsnas virsdaļas matu galos spēcīgākam gaišinājumam pieklusināti smilšu blondā tonī. Sānus atstāj dabiskus un ietonē, lai novērstu dzeltenīgi silto toni. | e490bfa4 |  |
| golden-highlights-men.name | Soft golden highlights | Maigi zeltainas šķipsnas | 3ea6e0df |  |
| golden-highlights-men.client | A few soft golden-brown highlights that add light and texture to short hair. | Dažas maigi zeltaini brūnas šķipsnas, kas īsiem matiem piešķir gaišumu un tekstūru. | 32a21c9b |  |
| golden-highlights-men.stylist | Foiled weaves through the top in a soft golden brown, kept subtle on a short cut. Suits clients who want a gentle lift. | Smalkas, folijā iestrādātas šķipsnas virsdaļā maigi zeltaini brūnā tonī, kas īsā griezumā izskatās neuzkrītoši. Piemērots klientiem, kuri vēlas vieglu gaišuma akcentu. | 691bd006 |  |
| brown-lowlights-men.name | Deeper chocolate-brown lowlights | Dziļāka toņa šokolādbrūni lowlights | d70d1f9e |  |
| brown-lowlights-men.client | Deeper brown strands that add depth and shape to lighter brown hair. | Tumšākas brūnas šķipsnas, kas gaiši brūniem matiem piešķir dziļumu un formu. | ee29455d |  |
| brown-lowlights-men.stylist | Fine chocolate-brown lowlights through the top, and the sides where the hair is long enough, to add depth and break up flat colour. Low upkeep. | Smalkas šokolādes brūnas tumšās šķipsnas (lowlights) virsdaļā un sānos, kur matu garums to atļauj, lai piešķirtu dziļumu un kliedētu plakanu toni. Viegla kopšana. | 9efc6bf6 |  |
| midnight-blue-short-men.name | Midnight blue on short hair | Pusnakts zils īsiem matiem | 18011205 |  |
| midnight-blue-short-men.client | A very dark blue that reads as near-black indoors and shows blue in daylight. | Ļoti tumši zils tonis, kas iekštelpās izskatās teju melns, bet dienasgaismā atklāj zilu nokrāsu. | 4a666b1a |  |
| midnight-blue-short-men.stylist | A deep blue over a base lightened enough for the blue to read. On short hair the lightener sits on the scalp, so check the scalp first; regrowth shows quickly. | Dziļi zils tonis uz bāzes, kas izbalināta pietiekami, lai zilais tonis izceltos. Īsos matos balinātājs skar galvas ādu, tāpēc vispirms novērtē galvas ādas stāvokli; ataugušās saknes kļūst pamanāmas ātri. | 7d43c413 |  |
| platinum-blonde.name | Platinum blonde | Platīnblonds | 78e55044 |  |
| platinum-blonde.client | A very light, almost white blonde that looks bright and cool. It needs regular salon visits to stay that way. | Ļoti gaišs, gandrīz balts blonds tonis, kas izskatās spilgts un vēss. Lai to uzturētu, nepieciešami regulāri salona apmeklējumi. | 7c8d1b59 |  |
| platinum-blonde.stylist | Final level depends on how much pigment is left after lightening and on the hair's condition; the last stage is usually toning. Needs in-person assessment and strand testing; sessions are not promised. | Gala tonis ir atkarīgs no tā, cik daudz pigmenta paliek pēc balināšanas un kāds ir matu stāvoklis; noslēdzošais posms parasti ir tonēšana. Nepieciešama klātienes konsultācija un šķipsnas tests; konkrēts vizīšu skaits netiek garantēts. | 95ba1656 |  |
| icy-blonde.name | Icy blonde | Ledus blonds | 7a890722 |  |
| icy-blonde.client | A very pale blonde toned cool, with an ash or violet reflect and no yellow. It needs regular toning to stay icy. | Ļoti gaišs, vēsi tonēts blonds tonis ar pelnu vai violetu atspulgu un bez dzeltenuma. Nepieciešama regulāra tonēšana, lai saglabātu ledaino efektu. | e4d2300c |  |
| icy-blonde.stylist | Tone is carried mostly by toner on a clean pale base; toner life is short, so a gloss interval is part of the plan. Chemical plans need an in-person appointment and a strand test. | Toni galvenokārt nodrošina toneris uz tīras, gaišas bāzes; tonera noturība ir īsa, tāpēc regulārs glosings ir daļa no plāna. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 42faa47a | safety; checked |
| pearl-blonde.name | Pearl blonde | Pērļu blonds | 7cda2e23 |  |
| pearl-blonde.client | A soft, shimmery pale blonde with a hint of pink-lilac. It looks glowy and gentle rather than stark. | Maigs, mirdzošs gaiši blonds tonis ar vieglu rozā un ceriņkrāsas niansi. Tas izskatās starojošs un maigs, nevis ass. | b71b8043 |  |
| pearl-blonde.stylist | Pearl is mainly a toning choice on a level 9-10 base; too much violet-pink reads as lilac. Chemical plans need an in-person appointment and a strand test. | Pērļu tonis galvenokārt ir tonēšanas izvēle uz 9.–10. līmeņa bāzes; pārāk daudz violeti rozā pigmenta radīs ceriņkrāsas toni. Ķīmisku procedūru plānošanai nepieciešama klātienes vizīte un šķipsnas tests. | 39566048 | safety; checked |
| champagne-blonde.name | Champagne blonde | Šampanieša blonds | f7358827 |  |
| champagne-blonde.client | A light, creamy blonde with a soft gold-beige glow. | Gaišs, krēmīgs blonds tonis ar maigu zeltīti bēšu mirdzumu. | c3efde5d |  |
| champagne-blonde.stylist | A good bridge shade for clients who want blonde but not stark; allows a longer toner interval than cool blondes. Chemical plans need an in-person appointment and a strand test. | Lielisks pārejas tonis klientiem, kuri vēlas blondu, bet ne pārāk krasu toni; ļauj retāk atjaunot toneri nekā vēsajiem blondajiem toņiem. Ķīmisku procedūru plānošanai nepieciešama klātienes vizīte un šķipsnas tests. | d1f8884b | safety; checked |
| vanilla-blonde.name | Vanilla blonde | Vaniļas blonds | 790da025 |  |
| vanilla-blonde.client | A soft, buttery blonde that looks bright and friendly. | Maigs sviesta blonds tonis, kas izskatās gaišs un patīkams. | 2adbe2a3 |  |
| vanilla-blonde.stylist | Sits between golden and platinum; usually a light-level base with a pale gold-cream toner. Chemical plans need an in-person appointment and a strand test. | Tonis starp zeltaino un platīnblondo; parasti to veido uz gaišas bāzes ar maigu, zeltaini krēmīgu toneri. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | ec9a20a2 | safety; checked |
| beige-blonde.name | Beige blonde | Bēšais blonds | d6f6980d |  |
| beige-blonde.client | A soft blonde balanced between warm and cool, so it reads natural rather than golden or ashy. | Maigs blonds tonis, kurā līdzsvarots siltums un vēsās nianses, tāpēc tas izskatās dabisks, nevis izteikti zeltains vai pelēcīgs. | 5c5c3510 |  |
| beige-blonde.stylist | Neutral targets still need the underlying warmth neutralised; use a gentle toner so the base does not look flat. Chemical plans need an in-person appointment and a strand test. | Arī neitrālam tonim ir jāneitralizē matu siltais pigments; izmanto saudzīgu toneri, lai bāze neizskatītos plakana. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 5c95bdb7 | safety; checked |
| sandy-blonde.name | Sandy blonde | Smilšu blonds | b76ea2c8 |  |
| sandy-blonde.client | A soft, natural blonde that looks like it came with you. Easy to live with. | Maigs, dabisks blonds tonis, kas izskatās gluži kā tavs dabiskais. Ar to ir ļoti viegli sadzīvot. | dc17911a |  |
| sandy-blonde.stylist | Good for clients near level 5-7 who want a low-maintenance lift; often combined with root shadow for an easy grow-out. Chemical plans need an in-person appointment and a strand test. | Piemērots klientiem ar aptuveni 5.–7. līmeņa matiem, kuri vēlas viegli kopjamu gaišinājumu; bieži kombinē ar sakņu ēnojumu dabiskai ataugšanai. Pirms ķīmiskām procedūrām nepieciešama klātienes konsultācija un šķipsnas tests. | f5c10ad7 | safety; checked |
| ash-blonde.name | Ash blonde | Pelnu blonds | 3dd48c6a |  |
| ash-blonde.client | A cool, smoky blonde with no gold in it. It looks modern and crisp. | Vēss, dūmakains blonds tonis bez zeltīta mirdzuma. Tas izskatās moderns un izteiksmīgs. | e4735f2f |  |
| ash-blonde.stylist | Ash is a reflect, not a lightness: warmth must be neutralised first and the porosity of the hair strongly affects how it holds. Chemical plans need an in-person appointment and a strand test. | Pelnu tonis ir niance, nevis gaišuma līmenis: vispirms jāneitralizē siltais pigments, un matu porainība būtiski ietekmē noturību. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 4049c997 | safety; checked |
| honey-blonde.name | Honey blonde | Medus blonds | 8ef2f60d |  |
| honey-blonde.client | A glowing, warm blonde with golden-amber depth. It looks sunny and rich. | Starojošs, silts blonds tonis ar zeltaina dzintara dziļumu. Tas izskatās saulains un piesātināts. | 228c6c61 |  |
| honey-blonde.stylist | Warmth is the goal, so it is more forgiving than cool blondes, but the gold should be even rather than orange. Chemical plans need an in-person appointment and a strand test. | Mērķis ir silts tonis, tāpēc tas nav tik prasīgs kā vēsie blondie, taču zeltam jābūt vienmērīgam, nevis oranžam. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 0cc51e88 | safety; checked |
| golden-blonde.name | Golden blonde | Zeltainais blonds | d0813d92 |  |
| golden-blonde.client | A bright sun-warmed blonde with golden shine. | Spilgts, saulains blonds tonis ar zeltītu spīdumu. | 71f785b1 |  |
| golden-blonde.stylist | Needs enough lift to clear orange before the gold is deposited; the toner decides whether it reads clear gold or brass. Chemical plans need an in-person appointment and a strand test. | Mati jāpagaišina pietiekami, lai noņemtu oranžo toni pirms zelta pigmenta ieklāšanas; toneris nosaka, vai tas izskatīsies kā tīrs zelts vai misiņš. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | baa4824b | safety; checked |
| dark-blonde.name | Dark blonde | Tumši blonds | 56245391 |  |
| dark-blonde.client | A deeper blonde that sits halfway to light brown. Easy to wear and easy to grow out. | Dziļāks blonds tonis, kas ir pusceļā uz gaiši brūnu. Viegli nēsāt un viegli ataudzēt. | 11dc3c36 |  |
| dark-blonde.stylist | Often used as a base before adding dimension with babylights or balayage. Chemical plans need an in-person appointment and a strand test. | Bieži izmanto kā bāzi pirms dziļuma piešķiršanas ar babylights šķipsnām vai balayage. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 2450c8fb | safety; checked |
| strawberry-blonde.name | Strawberry blonde | Zemeņu blonds | dd0d893b |  |
| strawberry-blonde.client | A light blonde with a peachy copper glow. It looks soft and warm. | Gaiši blonds tonis ar persiku un vara mirdzumu. Tas izskatās maigs un silts. | 056e3ae0 |  |
| strawberry-blonde.stylist | Copper-pink tones tend to fade early; an in-between gloss helps. Chemical plans need an in-person appointment and a strand test. | Vara rozā toņi mēdz ātri izbalēt; palīdz glosings starp krāsošanas reizēm. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 97c5b146 | safety; checked |
| bronde.name | Bronde | Bronde | d68b8a8d | same |
| bronde.client | The best of brown and blonde: depth at the root with softer light through the lengths. | Labākais no brūnā un blondā: dziļums pie saknēm un maigs gaišums matu garumā. | 0cb54b9f |  |
| bronde.stylist | A combination of shade and technique in clients' minds; in this library bronde is the colour result and balayage or babylights are the placement. Chemical plans need an in-person appointment and a strand test. | Klientu uztverē tā ir toņa un tehnikas kombinācija; šeit «bronde» ir krāsas rezultāts, bet balayage vai babylights — šķipsnu izvietojums. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | b88a7324 | safety; checked |
| light-brown.name | Light brown | Gaiši brūns | d5b0c919 |  |
| light-brown.client | A natural mid-light brown that goes with almost everything. | Dabisks, vidēji gaišs brūns tonis, kas piestāv gandrīz visam. | 4501d73d |  |
| light-brown.stylist | A good deposit-only shade for many bases; check the underlying warmth when the starting hair is lighter and needs refilling. Chemical plans need an in-person appointment and a strand test. | Lielisks tonis krāsošanai bez gaišināšanas daudzām bāzēm; pārbaudi silto bāzes pigmentu, ja mati sākumā ir gaišāki un tiem nepieciešama repigmentācija. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | fda086bb | safety; checked |
| ash-brown.name | Ash brown | Pelnu brūns | 44677d8a |  |
| ash-brown.client | A cool, smoky brown with no warmth. It looks sleek and modern. | Vēss, dūmakains brūns tonis bez siltām niansēm. Tas izskatās gluds un moderns. | 0198fb31 |  |
| ash-brown.stylist | Cool reflect is a thin layer; porous mid-lengths and ends may need an extra toning step. Chemical plans need an in-person appointment and a strand test. | Vēsā niance veido plānu pigmenta kārtu; porainiem matiem garumā un galos var būt nepieciešama papildu tonēšana. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 5ce192df | safety; checked |
| mushroom-brown.name | Mushroom brown | Mushroom brown | c4ed9d88 | same |
| mushroom-brown.client | A soft, grey-toned brown with a smoky, luxe feel. | Maigs, pelēcīgs brūns tonis ar dūmakainu un greznu noskaņu. | d5011ba6 |  |
| mushroom-brown.stylist | Hardest on warm bases; neutralising underlying red-orange is the main job. Chemical plans need an in-person appointment and a strand test. | Visgrūtāk iegūstams uz siltām bāzēm; galvenais uzdevums ir neitralizēt sarkani oranžo pigmentu. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 1dc7bd13 | safety; checked |
| mushroom-blonde.name | Mushroom blonde | Mushroom blonde | 15777966 | same |
| mushroom-blonde.client | A hazy, grey-beige blonde that looks rich and subtle. | Dūmakains, pelēkbēšs blonds tonis, kas izskatās piesātināts un smalks. | fdc4777d |  |
| mushroom-blonde.stylist | Needs clean lift before the muted tone is placed; hair that is yellow will push it toward olive. Chemical plans need an in-person appointment and a strand test. | Pirms pieklusinātā toņa ieklāšanas nepieciešama tīra gaišināšanas bāze; dzeltenais pigments matos var aizvirzīt toni uz olīvzaļo pusi. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | eda85a02 | safety; checked |
| chocolate-brown.name | Chocolate brown | Šokolādes brūns | 80e06211 |  |
| chocolate-brown.client | A rich, deep brown with a gentle warmth and plenty of shine. | Piesātināts, dziļi brūns tonis ar maigu siltumu un izteiktu spīdumu. | c900e420 |  |
| chocolate-brown.stylist | Deposit-only; easy to apply on lighter bases, but remember it is harder to go lighter again. Chemical plans need an in-person appointment and a strand test. | Krāsojams bez gaišināšanas; viegli ieklājams uz gaišākām bāzēm, taču atceries, ka vēlāk matus padarīt gaišākus būs grūtāk. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | cf029c0f | safety; checked |
| milk-chocolate.name | Milk chocolate | Piena šokolāde | c6a87240 |  |
| milk-chocolate.client | A soft, creamy brown that is warm but not red. | Maigs, krēmīgs brūns tonis, kas ir silts, bet bez sarkanuma. | b99e440f |  |
| milk-chocolate.stylist | A helpful 'brown with glow' choice for clients lightening gently from dark. Chemical plans need an in-person appointment and a strand test. | Lieliska izvēle «mirdzoši brūnam» tonim klientiem, kuri no tumšas bāzes saudzīgi pāriet uz gaišāku. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 01d12ec5 | safety; checked |
| chestnut-brown.name | Chestnut brown | Kastaņbrūns | 9e9e3b92 |  |
| chestnut-brown.client | A warm brown with a red-gold depth that catches the light. It suits a natural-looking change. | Silts brūns tonis ar sarkanīgi zeltītu dziļumu, kas skaisti atstaro gaismu. Lieliski piemērots dabiskām pārmaiņām. | 45a8a253 |  |
| chestnut-brown.stylist | Red pigment fades early; plan a refresher gloss if it matters. Chemical plans need an in-person appointment and a strand test. | Sarkanais pigments ātri izbalē; ieplāno atsvaidzinošu glosingu, ja tas ir svarīgi. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 9d1708ee | safety; checked |
| espresso-brown.name | Espresso | Espreso | e25dc476 |  |
| espresso-brown.client | A deep, shiny dark brown that reads nearly black in low light and lighter in sun. | Dziļš, mirdzošs tumši brūns tonis, kas vājākā apgaismojumā šķiet teju melns, bet saulē atklājas gaišāks. | a0c3269a |  |
| espresso-brown.stylist | Deep dyed levels do not lift cleanly later; mention this in planning. Chemical plans need an in-person appointment and a strand test. | Dziļi krāsoti toņi vēlāk nepadodas tīrai gaišināšanai; piemini to plānojot. Pirms ķīmiskām procedūrām nepieciešama klātienes konsultācija un šķipsnas tests. | 331eed7e | safety |
| mocha-brown.name | Mocha | Moka | 676cf0fe |  |
| mocha-brown.client | A smooth coffee brown that works on many people. | Samtains kafijas brūnais tonis, kas piestāv daudziem. | d7085416 |  |
| mocha-brown.stylist | A good default for 'natural brunette' requests; add babylights for movement. Chemical plans need an in-person appointment and a strand test. | Lieliska izvēle, ja klients vēlas «dabiski brūnu toni»; pievieno babylights šķipsnas dzīvīgumam. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | d3edc8f4 | safety; checked |
| caramel-brown.name | Caramel | Karameles tonis | dca40757 |  |
| caramel-brown.client | A warm golden brown, like caramel, that brightens brown hair without going blonde. | Silts zeltaini brūns tonis kā karamele, kas izgaismo brūnus matus, nepadarot tos blondus. | b58bc131 |  |
| caramel-brown.stylist | Often placed as highlights or balayage on a brown base; deposit alone on dark hair mostly shows in sunlight. Chemical plans need an in-person appointment and a strand test. | Bieži veido kā šķipsnas vai balayage uz brūnas bāzes; krāsojot tumšus matus bez gaišināšanas, tonis galvenokārt redzams saules gaismā. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 4f131eb9 | safety; checked |
| cinnamon-brown.name | Cinnamon brown | Kanēļbrūns | aaba817b |  |
| cinnamon-brown.client | A warm, spiced brown with a coppery glow. | Silts brūns tonis ar garšvielu noti un vara mirdzumu. | 05c8a3b9 |  |
| cinnamon-brown.stylist | A mid-way option for clients curious about red without committing. Chemical plans need an in-person appointment and a strand test. | Lielisks vidusceļš klientiem, kuri vēlas izmēģināt rudos toņus, bet vēl nav gatavi pilnībā tiem piesaistīties. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 6198b2a3 | safety; checked |
| golden-brown.name | Golden brown | Zeltaini brūns | 64a78b44 |  |
| golden-brown.client | A bright, warm brown with gold in it. | Gaišs, silts brūns tonis ar zeltītu mirdzumu. | 5f19dce4 |  |
| golden-brown.stylist | Gold on level 5-6 is straightforward on a similar base; dark bases need lift to show it. Chemical plans need an in-person appointment and a strand test. | Zeltainu toni 5.–6. līmenī ir viegli iegūt uz līdzīgas bāzes; tumšai bāzei nepieciešama gaišināšana, lai tas izceltos. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | cd1de2c3 | safety; checked |
| auburn.name | Auburn | Kastaņruds | 7261410f |  |
| auburn.client | A brown with a clear red warmth, softer than a bright copper. | Brūns tonis ar izteiktu sarkanīgu siltumu — maigāks par košu varu. | 357db97f |  |
| auburn.stylist | Red fades early, so a regular gloss interval is normal; mention this in the upkeep conversation. Chemical plans need an in-person appointment and a strand test. | Sarkanais tonis ātri izbalē, tāpēc regulārs glosinga intervāls ir ierasta lieta; piemini to sarunā par toņa uzturēšanu. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 026edbeb | safety; checked |
| copper.name | Copper | Vara tonis | d35b0efe |  |
| copper.client | A bright, warm copper with an orange-red glow. It is eye-catching and fades quickly, so it needs regular glosses. | Spilgts, silts vara tonis ar oranžsarkanu mirdzumu. Tas piesaista skatienus un ātri izbalē, tāpēc toni vajag regulāri atsvaidzināt ar gloss. | 500eaec3 |  |
| copper.stylist | Brightness depends on a clean warm base; depositing copper over dark hair gives only a subtle tint. Chemical plans need an in-person appointment and a strand test. | Spilgtums ir atkarīgs no tīras, siltas bāzes; klājot vara toni uz tumšiem matiem, iegūsi tikai vieglu nokrāsu. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | a3097e87 | safety; checked |
| ginger.name | Ginger | Dzidri ruds | 544a9cb4 |  |
| ginger.client | A bright, golden orange that looks sunny and playful. | Spilgts, zeltaini oranžs tonis, kas izskatās saulains un rotaļīgs. | 3237df64 |  |
| ginger.stylist | Needs enough lift to avoid muddy orange; light copper tones fade very fast. Chemical plans need an in-person appointment and a strand test. | Nepieciešama pietiekama gaišināšana, lai tonis nekļūtu netīri oranžs; gaišie vara toņi izbalē ļoti ātri. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 575970ec | safety; checked |
| cherry-cola.name | Cherry cola | Cherry cola | 46027f17 | same |
| cherry-cola.client | A dark brown with a juicy cherry shine that shows in the light. | Tumši brūns tonis ar sulīgu ķiršu spīdumu, kas atklājas gaismā. | 9b30413f |  |
| cherry-cola.stylist | A depositing red-violet over brown; red fading is typical, so give a gloss interval. Chemical plans need an in-person appointment and a strand test. | Tonējošs sarkanviolets tonis uz brūnas bāzes; sarkanā toņa izbalēšana ir ierasta, tāpēc ieplāno regulāru glosingu. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 2940e09e | safety; checked |
| mahogany.name | Mahogany | Mahagons | c678b4d8 |  |
| mahogany.client | A deep, plummy red-brown with a luxe glow. | Dziļš sarkani brūns tonis ar plūmju niansi un greznu mirdzumu. | db04443f |  |
| mahogany.stylist | Violet-red pigment holds better than orange-red but still fades; a reflective gloss keeps it fresh. Chemical plans need an in-person appointment and a strand test. | Violeti sarkanais pigments turas labāk nekā oranži sarkanais, taču arī tas izbalē; mirdzošs glosings palīdz uzturēt toni svaigu. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 0310d54a | safety; checked |
| burgundy-wine.name | Burgundy | Bordo | 4c19d796 |  |
| burgundy-wine.client | A deep wine red that looks dramatic in sunlight and nearly brown indoors. | Dziļš vīnsarkans tonis, kas saules gaismā izskatās dramatisks, bet iekštelpās šķiet gandrīz brūns. | 17334d27 |  |
| burgundy-wine.stylist | A depositing or semi-vivid tone on a dark base; deeper reds are less forgiving to remove. Chemical plans need an in-person appointment and a strand test. | Tonējošs vai daļēji košs tonis uz tumšas bāzes; dziļākus sarkanos toņus izņemt ir grūtāk. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 31aa3a3d | safety; checked |
| soft-black.name | Soft black | Maigi melns | 7cc2599e |  |
| soft-black.client | A deep, soft black that looks natural and shiny. | Dziļš, maigi melns tonis, kas izskatās dabisks un mirdzošs. | 38a8f211 |  |
| soft-black.stylist | Dark artificial pigment does not lift cleanly; any later colour change should be assessed in person. Chemical plans need an in-person appointment and a strand test. | Tumšs mākslīgais pigments nepadodas tīrai gaišināšanai; jebkura turpmāka krāsas maiņa jānovērtē klātienē. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | e48fee9f | safety; checked |
| jet-black.name | Jet black | Piķmelns | 8868663c |  |
| jet-black.client | A deep black with a glossy shine. It is dramatic and bold. | Dziļi melns tonis ar izteiktu spīdumu – dramatisks un drosmīgs. | e04fbd92 |  |
| jet-black.stylist | Dark pigment often sits in the hair for a long time; bear this in mind before recommending. Chemical plans need an in-person appointment and a strand test. | Tumšais pigments matos mēdz saglabāties ilgi; ņem to vērā pirms toņa ieteikšanas. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | e355e066 | safety; checked |
| blue-black.name | Blue-black | Zili melns | 327143ba |  |
| blue-black.client | A black with a cool blue shine, like a raven's wing. | Melns tonis ar vēsu, zilganu spīdumu – kā kraukļa spārns. | 1ab0c698 |  |
| blue-black.stylist | The blue reflect is a surface effect and fades first; the base remains dark pigment that needs careful removal planning. Chemical plans need an in-person appointment and a strand test. | Zilais atspīdums ir virspusējs efekts un izbalē vispirms; pamatā paliek tumšs pigments, kura izņemšanai nepieciešama rūpīga plānošana. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 47e80e35 | safety; checked |
| darkest-brown.name | Darkest brown | Tumšākais brūnais | 976d6346 |  |
| darkest-brown.client | A near-black brown that is softer than black. | Gandrīz melns brūnais tonis, kas ir maigāks par melno. | d397abe7 |  |
| darkest-brown.stylist | A useful 'natural dark' option when a true black feels too hard. Chemical plans need an in-person appointment and a strand test. | Lieliska «dabiski tumša» izvēle, ja tīri melns tonis šķiet pārāk ass. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 2e1d007d | safety; checked |
| silver-white.name | Silver white | Sudrabbalts | d90266d0 |  |
| silver-white.client | A clean, bright silver that looks bold and chic. | Tīrs, gaišs sudraba tonis, kas izskatās drosmīgs un elegants. | 712acaf9 |  |
| silver-white.stylist | Done by lightening to a very pale base and toning with cool pigments; natural grey usually needs toning too, as it can be yellowed. Chemical plans need an in-person appointment and a strand test. | Iegūst, gaišinot matus līdz ļoti gaišai bāzei un tonējot ar vēsiem pigmentiem; arī dabiski sirmiem matiem parasti vajadzīga tonēšana, jo tie var būt iedzelteni. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 7c00c0c8 | safety; checked |
| steel-grey.name | Steel grey | Tērauda pelēks | d72829f4 |  |
| steel-grey.client | A modern grey with a cool metallic shine. | Mūsdienīgs pelēkais tonis ar vēsu, metālisku spīdumu. | c4e92d8d |  |
| steel-grey.stylist | Needs a clean pale base, then pigment is layered; uneven porosity causes a patchy look. Chemical plans need an in-person appointment and a strand test. | Nepieciešama tīra, gaiša bāze, pēc tam pigments tiek klāts slāņos; nevienmērīga porainība rada pleķainu izskatu. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 95b2e965 | safety; checked |
| charcoal-grey.name | Charcoal grey | Ogļu pelēks | 67018e69 |  |
| charcoal-grey.client | A moody, dark grey that feels fashion-forward. | Dziļš, tumši pelēks tonis ar izteikti modernu raksturu. | 7c28eb5b |  |
| charcoal-grey.stylist | Typically lighter bases are toned grey; dark bases need to be lifted first. Chemical plans need an in-person appointment and a strand test. | Parasti pelēko toni iegūst, tonējot gaišāku bāzi; tumša bāze vispirms ir jāizgaišina. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | d4e07ee4 | safety; checked |
| blonde-grey-blend.name | Grey blend: blonde | Grey blend: blonds | 3c81a39b |  |
| blonde-grey-blend.client | Blonde lights that soften grey so there is no hard regrowth line. | Gaišas šķipsnas, kas padara sirmumu maigāku, lai ataugot neveidotos krasa pārejas līnija. | 9f5f786e |  |
| blonde-grey-blend.stylist | Often paired with lowlights. Grey texture and percentage change how much lift or toner is needed. Chemical plans need an in-person appointment and a strand test. | Bieži kombinē ar lowlights šķipsnām. Sirmo matu struktūra un daudzums nosaka, cik daudz gaišināšanas vai tonētāja būs nepieciešams. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | a22cfc74 | safety; checked |
| brunette-grey-blend.name | Grey blend: brunette | Grey blend: brunets | 8196c1a4 |  |
| brunette-grey-blend.client | Brown lights and lowlights that merge with natural grey, so the grey looks softer and grows out gently. | Gaišākas un tumšākas brūnās šķipsnas, kas saplūst ar dabiskajiem sirmajiem matiem, padarot sirmumu maigāku un ataugšanu — nemanāmu. | 565de79b |  |
| brunette-grey-blend.stylist | Placement and tone selection depend on grey percentage; a well-blended result grows out gently. Chemical plans need an in-person appointment and a strand test. | Šķipsnu izvietojums un toņa izvēle ir atkarīgi no sirmo matu procenta; labi sapludināts rezultāts ataug nemanāmi. Pirms ķīmiskām procedūrām nepieciešama klātienes konsultācija un šķipsnas tests. | 4980a783 | safety; checked |
| natural-silver-grow-out.name | Natural grey, enhanced | Dabiskais sirmums ar akcentu | ee6648d0 |  |
| natural-silver-grow-out.client | Letting your own grey show and keeping it bright. The grow-out phase can be bridged with lights. | Ļauj parādīties savam dabiskajam sirmumam un uzturi to mirdzošu. Pārejas posmu var viegli atvieglot ar gaišām šķipsnām. | 085f86cd |  |
| natural-silver-grow-out.stylist | The transition from dyed hair to natural grey often involves blending lights and a gloss. Chemical plans need an in-person appointment and a strand test. | Pārejai no krāsotiem matiem uz dabiski sirmiem bieži izmanto sapludinošas šķipsnas un gloss procedūru. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 154b6fdf | safety; checked |
| pastel-pink.name | Pastel pink | Pasteļrozā | b9b33320 |  |
| pastel-pink.client | A soft candy pink on very light hair. It fades fast and needs the hair lightened first. | Maigs konfekšu rozā tonis uz ļoti gaišiem matiem. Tas ātri izmazgājas, un mati pirms tam ir jāizbalina. | 9a1c22be |  |
| pastel-pink.stylist | Pastels need a pale-yellow level 9-10 base; fading is faster than saturated tones. Chemical plans need an in-person appointment and a strand test. | Pasteļtoņiem nepieciešama bāli dzeltena 9.–10. līmeņa bāze; tie izbalē ātrāk nekā piesātināti toņi. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | f4894186 | safety; checked |
| rose-gold.name | Rose gold | Rozā zelts | 1777f09f |  |
| rose-gold.client | A blonde with a soft pink-gold shimmer. | Blonds tonis ar maigu rozīgi zeltītu mirdzumu. | 4185650e |  |
| rose-gold.stylist | A mix of pale base and soft depositing pink-copper; the tone may stay pastel and gradually soften. Chemical plans need an in-person appointment and a strand test. | Gaišas bāzes un maiga, tonējoša rozā un vara toņa kombinācija; tonis var palikt pastelīgs un pakāpeniski kļūt maigāks. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | acaa2545 | safety; checked |
| lavender.name | Lavender | Lavanda | 60707cfe |  |
| lavender.client | A soft, dreamy lilac that is playful and delicate. | Maigs, sapņains ceriņu tonis – rotaļīgs un smalks. | c6c70019 |  |
| lavender.stylist | Violet fades to silver-grey or beige; on blonde bases it can leave a lasting tint. Chemical plans need an in-person appointment and a strand test. | Violetais tonis izbalē līdz sudrabaini pelēkam vai bēšam; uz blondas bāzes tas var atstāt noturīgu nokrāsu. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 51b8983e | safety; checked |
| teal.name | Teal | Zilganzaļš | fa15a5c1 |  |
| teal.client | A rich blue-green that looks bold and artistic. | Piesātināts zilganzaļš tonis, kas izskatās drosmīgs un māksliniecisks. | 21b4fecb |  |
| teal.stylist | Blue and green deposit differently; the base's yellow pushes toward green, so base level matters. Chemical plans need an in-person appointment and a strand test. | Zilie un zaļie pigmenti matos klājas atšķirīgi; bāzes dzeltenais tonis virza toni uz zaļo pusi, tāpēc bāzes līmenim ir liela nozīme. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | dfbe7efc | safety; checked |
| cherry-red.name | Cherry red | Ķiršsarkans | 8a2347b7 |  |
| cherry-red.client | A vivid, shiny red that looks confident and bold. | Spilgts, mirdzošs sarkans tonis, kas izskatās pārliecinošs un drosmīgs. | 75a86607 |  |
| cherry-red.stylist | Red pigment is vivid but fades; regular glossing, cool washes and fewer heat tools matter. Chemical plans need an in-person appointment and a strand test. | Sarkanais pigments ir košs, taču izbalē; svarīga ir regulāra gloss procedūra, mazgāšana vēsā ūdenī un retāka karsto veidošanas ierīču lietošana. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | e4e8f7f0 | safety; checked |
| midnight-blue.name | Midnight blue | Pusnakts zils | 0b31ed2a |  |
| midnight-blue.client | A deep ink-blue that shows in the sun and stays subtle indoors. | Dziļš tintes zils tonis, kas atklājas saulē, bet iekštelpās paliek neuzkrītošs. | e7eb2b8e |  |
| midnight-blue.stylist | On dark natural hair it shows as a tint; bright blue needs lightening. Chemical plans need an in-person appointment and a strand test. | Uz tumšiem dabiskiem matiem tas izskatās kā viegla nokrāsa; spilgti zilam tonim nepieciešama gaišināšana. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 02e5a922 | safety; checked |
| peach-apricot.name | Peach apricot | Persiku un aprikožu tonis | 796855ef |  |
| peach-apricot.client | A sunny, soft coral-peach that feels fresh. | Saulains, maigs koraļļpersiku tonis ar svaigu noskaņu. | 3b0a1804 |  |
| peach-apricot.stylist | Pastel orange fades to blonde-ish gold; careful lightening is needed. Chemical plans need an in-person appointment and a strand test. | Pasteļoranžais tonis izbalē līdz zeltaini blondam tonim; nepieciešama rūpīga gaišināšana. Pirms ķīmiskām procedūrām nepieciešama klātienes konsultācija un šķipsnas tests. | 12ac067c | safety; checked |
| plum-violet.name | Plum violet | Plūmju violetais | fe78e7d3 |  |
| plum-violet.client | A rich purple with a velvety shine. | Piesātināts violets tonis ar samtainu spīdumu. | 2ecd0a98 |  |
| plum-violet.stylist | Violet deposits well on a lightened base; on dark bases it shows only subtly. Chemical plans need an in-person appointment and a strand test. | Violetais pigments labi klājas uz gaišinātas bāzes; uz tumšas bāzes tas ir redzams tikai kā smalka nianse. Pirms ķīmiskām procedūrām nepieciešama klātienes vizīte un šķipsnas tests. | 71a1fc37 | safety; checked |
| all-over.name | All-over colour (single process) | Krāsošana visā garumā (viens tonis) | 084576a3 |  |
| all-over.client | One even colour from roots to ends. Simple and polished, and the roots show as the hair grows. | Viens vienmērīgs tonis no saknēm līdz galiem. Eleganti un sakopti, bet, matiem ataugot, saknes būs redzamas. | 06b4c307 |  |
| all-over.stylist | Works for shades at or near the client's current visible level, or darker. Lifting more than a little needs a different technique. Best when the hair is evenly coloured and the target is at a similar or darker level. Predictable on healthy hair; the less the shade differs from the natural level, the softer the regrowth. Always check history and keep the skin test in the plan. | Piemērots toņiem, kas ir klienta pašreizējā redzamajā līmenī, tuvu tam vai tumšāki. Lai iegūtu pamanāmi gaišāku toni, nepieciešama cita tehnika. Vislabākais rezultāts ir tad, ja mati ir vienmērīgi nokrāsoti un mērķa tonis ir līdzīgā līmenī vai tumšāks. Uz veselīgiem matiem rezultāts ir paredzams; jo mazāk tonis atšķiras no dabiskā līmeņa, jo maigāka būs ataugšana. Vienmēr noskaidro matu krāsošanas vēsturi un plānā iekļauj ādas testu. | 11cf4fe8 | safety; checked |
| gloss.name | Gloss / glaze (tone refresh) | Gloss / glaze (toņa atsvaidzināšana) | dbbb2af4 |  |
| gloss.client | An easy, sheer colour or toner that adjusts tone and adds shine. It does not usually lift. | Viegls, caurspīdīgs tonētājs, kas piekoriģē toni un piešķir matiem spīdumu. Tas parasti nepadara matus gaišākus. | 5514326e |  |
| gloss.stylist | Can refresh ash, gold, copper or red tones between visits; cannot cover heavy grey or lighten. Suits any starting level. Good bridge between colour visits. Result depends heavily on porosity and the existing colour; sheer pigment shows most on lighter hair. | Var atsvaidzināt pelnu, zeltītos, vara vai rudos toņus starp vizītēm; nespēj nosegt izteiktu sirmo matu daudzumu un negaišina. Piemērots jebkuram sākuma līmenim. Lielisks risinājums starp krāsošanas reizēm. Rezultāts ir ļoti atkarīgs no matu porainības un esošās krāsas; caurspīdīgais pigments vislabāk pamanāms gaišākos matos. | c3338a24 |  |
| foil-highlights.name | Foil highlights | Šķipsnas folijā | 5131419c |  |
| foil-highlights.client | Sections of hair are lightened inside foils for a clear, bright, structured lift. | Matu šķipsnas balina folijā, iegūstot izteiksmīgu, gaišu un strukturētu rezultātu. | dd9c681f |  |
| foil-highlights.stylist | Pairs with beige, golden, honey, ash or platinum blondes on light to medium bases. Best when starting from level 3-7, healthy, little prior colour. Strong lift and control; the wider the contrast, the more visible the root line. Needs appointment and strand test. | Sader ar bēšajiem, zeltainajiem, medus, pelnu vai platīna blondajiem toņiem uz gaišas līdz vidējas bāzes. Vislabāk piemērots 3.–7. līmeņa veselīgiem un iepriekš maz krāsotiem matiem. Spēcīga gaišināšana un kontrole; jo lielāks kontrasts, jo pamanāmāka sakņu līnija. Nepieciešama vizīte un šķipsnas tests. | 660ac814 | safety; checked |
| babylights.name | Babylights | Babylights | fd7b47a3 | same |
| babylights.client | Very fine, soft highlights like the natural lightness seen in children's hair. | Ļoti smalkas, maigas šķipsniņas, kas rada dabisku, bērnu matiem raksturīgu gaišumu. | 010ca398 |  |
| babylights.stylist | Pairs with soft blondes (beige, sandy, honey, champagne) and with grey blending. Best when starting from level 4-7, healthy. Takes time because of the fine sectioning; a good fit for gentle brightness and for blurring early grey. Strand test first. | Sader ar maigiem blondajiem toņiem (bēšo, smilšu, medus, šampanieša) un sirmo matu sapludināšanu. Vislabāk piemērots 4.–7. līmeņa veselīgiem matiem. Prasa laiku smalkā šķipsnu dalījuma dēļ; piemērots maigam gaišumam un pirmo sirmo matu izpludināšanai. Vispirms jāveic šķipsnas tests. | e32529fa | safety; checked |
| lowlights.name | Lowlights | Lowlights | 31e0e66f | same |
| lowlights.client | Strands deposited a few levels darker than the base to add depth or break up heavy highlights. | Par pamattoni dažus toņus tumšākas šķipsnas, kas piešķir dziļumu vai līdzsvaro pārāk gaišas šķipsnas. | 1d2d3892 |  |
| lowlights.stylist | Pairs with honey, caramel, ash or copper to add dimension; helps grey blending. Suits most starting levels, but very dark hair has little room to go darker. Useful to re-balance over-lightened hair and to soften grey. Grey percentage and tone decide the shade. | Lieliski sader ar medus, karameles, pelnu vai vara toņiem, lai piešķirtu dziļumu; palīdz sapludināt sirmos matus. Piemērots lielākajai daļai sākuma līmeņu, taču ļoti tumšiem matiem ir maz iespēju kļūt vēl tumšākiem. Noder, lai atjaunotu līdzsvaru pārgaišinātos matos un mīkstinātu sirmo matu pāreju. Toņa izvēli nosaka sirmo matu daudzums un vēlamais tonis. | 242a0f88 |  |
| balayage.name | Balayage | Balayage | ede5a06c | same |
| balayage.client | Colour painted by hand through the mid-lengths and ends, with a soft root, so it grows out gently. | Ar brīvu roku ieklāta krāsa matu vidusdaļā un galos ar maigu pāreju pie saknēm, lai mati ataugtu dabiski un nemanāmi. | 6d3465e5 |  |
| balayage.stylist | Pairs with caramel, honey, beige, bronde and copper; suits nearly any base though very dark hair needs more stages. Best when starting from level 3-7, healthy. Amount of lift varies with base level. Lighter results on dark hair take longer and may need more than one visit; history and condition must be checked first. | Lieliski sader ar karameles, medus, bēšajiem, bronde un vara toņiem; piemērots gandrīz jebkurai bāzei, lai gan ļoti tumšiem matiem nepieciešami vairāki posmi. Vislabāk piemērots, sākot no 3.–7. līmeņa veselīgiem matiem. Gaišināšanas pakāpe atkarīga no bāzes līmeņa. Gaišāks rezultāts uz tumšiem matiem prasa ilgāku laiku un var būt vajadzīgas vairākas vizītes; vispirms jānovērtē matu vēsture un stāvoklis. | ce4a0d48 |  |
| foilayage.name | Foilayage | Foilayage | d4705856 | same |
| foilayage.client | Painted like balayage, then wrapped in foil or film for a stronger, brighter lift. | Ieklāj ar roku kā balayage tehnikā un ietin folijā vai plēvē, lai iegūtu izteiktāku un gaišāku rezultātu. | d71ae58e |  |
| foilayage.stylist | Pairs with light blondes, honey, champagne, copper; useful when free-painted balayage would not lift enough. Best when starting from level 3-7, healthy. Wrapping gives stronger lift, so porous or fragile hair needs careful assessment. Same strand test and appointment requirement as other lightening. | Lieliski sader ar gaiši blondiem, medus, šampanieša un vara toņiem; noder, ja ar brīvroku balayage tehniku nepietiek vajadzīgajam gaišumam. Vislabāk piemērots, sākot no 3.–7. līmeņa veselīgiem matiem. Ietīšana folijā nodrošina spēcīgāku gaišināšanu, tāpēc poraini vai trausli mati rūpīgi jānovērtē. Tāpat kā citām gaišināšanas procedūrām, nepieciešama vizīte un šķipsnas tests. | a037dd26 | safety; checked |
| ombre.name | Ombre | Ombre | 649d926d | same |
| ombre.client | A two-tone gradient: darker roots flowing to much lighter lengths and ends. | Divu toņu pāreja: tumšāks tonis pie saknēm pakāpeniski pāriet krietni gaišākos matu garumos un galos. | 47b7a116 |  |
| ombre.stylist | Pairs with caramel, honey, blonde, copper and vivid ends. Best when starting from level 2-6, healthy lengths. Strong contrast needs a lot of lifting at the lengths; ends can be dry or porous. Needs a healthy-hair assessment. | Lieliski sader ar karameles, medus, blondiem, vara toņiem un košiem galiem. Vislabāk piemērots, sākot no 2.–6. līmeņa veselīgiem matiem visā garumā. Izteiktam kontrastam nepieciešama ievērojama garuma gaišināšana; gali var kļūt sausi vai poraini. Nepieciešams novērtēt matu stāvokli. | 3a645b2a |  |
| sombre.name | Sombre (soft ombre) | Sombre (maigais ombre) | aa5aaa2b |  |
| sombre.client | A softer ombre with a gentle fade between close tones. | Maigāks ombre variants ar nemanāmu pāreju starp savstarpēji tuviem toņiem. | c809fc2c |  |
| sombre.stylist | Pairs with beige, caramel, honey, bronde and muted tones. Best when starting from level 3-6. Needs less lift than ombre; the shade is chosen to melt softly into the base. | Lieliski sader ar bēšiem, karameļu, medus, bronde un pieklusinātiem toņiem. Vislabāk piemērots, sākot no 3.–6. līmeņa. Nepieciešama mazāka gaišināšana nekā ombre tehnikā; toni izvēlies tā, lai tas maigi saplūstu ar bāzi. | 56e9ae39 |  |
| root-shadow.name | Root shadow / root smudge | Root shadow / sakņu ieēnošana | a6abb83c |  |
| root-shadow.client | A slightly deeper colour at the roots that melts into the lengths, so regrowth shows less. | Nedaudz tumšāks tonis pie saknēm, kas pakāpeniski saplūst ar matu garumu, padarot ataugšanas līniju mazāk pamanāmu. | 5780e69a |  |
| root-shadow.stylist | Pairs with blonde, silver and vivid lengths to cover regrowth and add depth. Best when starting from light lengths with natural roots. Good for extending visits; the shadow shade must match the client's natural level and tone. | Lieliski sader ar blondiem, sudrabotiem un košiem matu garumiem, lai nomaskētu ataugušās saknes un piešķirtu dziļumu. Vislabāk piemērots, ja garumi ir gaiši un saknes dabiskas. Lielisks veids, kā paildzināt laiku starp vizītēm; sakņu ēnojuma tonim jāsaskan ar klienta dabisko līmeni un toni. | b78c399e |  |
| colour-melt.name | Colour melt | Colour melt | 1f0a328d | same |
| colour-melt.client | Two or three shades blended smoothly so one flows into the next, without a visible line. | Divi vai trīs toņi, kas plūstoši saplūst cits citā bez redzamām pārejas līnijām. | ff289947 |  |
| colour-melt.stylist | Pairs with multi-tone looks: brunette to caramel to blonde, or vivid blends. The right starting level depends on the target. Needs advanced blending skill. Final blend depends on base, porosity and chosen shades. | Lieliski sader ar daudztoņu tēliem: no brūna uz karameli un blondu, vai košo toņu pārejām. Piemērotākais sākuma līmenis ir atkarīgs no mērķa. Prasa izcilas toņu pludināšanas iemaņas. Gala rezultāts atkarīgs no bāzes, porainības un izvēlētajiem toņiem. | c6a1784c |  |
| money-piece.name | Money piece / face-framing | Money piece / sejas ierāmēšana | 91e94f3e |  |
| money-piece.client | Brighter sections at the front that frame the face, while the rest of your colour stays as it is. | Gaišākas šķipsnas priekšpusē, kas ierāmē seju, kamēr pārējā matu krāsa paliek nemainīga. | 90a9d841 |  |
| money-piece.stylist | Pairs with any base; golden, honey, platinum or copper accent strands. Best when starting from level 3-7. The face frame draws attention, so the tone must suit the client's skin and preferences. Lighter pieces need regular toning. | Piemērots jebkurai bāzei; zelta, medus, platīna vai vara akcenta šķipsnas. Vislabāk piemērots, sākot no 3.–7. līmeņa. Šķipsnas pie sejas piesaista uzmanību, tāpēc tonim jāsaskan ar klienta ādas toni un vēlmēm. Gaišākām šķipsnām nepieciešama regulāra tonēšana. | 567df920 |  |
| peekaboo.name | Peekaboo / underlights | Peekaboo / slēptās šķipsnas | 64172436 |  |
| peekaboo.client | Hidden colour in the underlayer or nape that shows when hair moves or is styled up. | Paslēpts krāsas akcents apakšējā matu slānī vai pakausī, kas atklājas, matiem kustoties vai tos saveidojot uz augšu. | 3bf404d8 |  |
| peekaboo.stylist | Pairs with vivid, copper or platinum accents under natural hair. Suits any starting level. Good where workplace rules limit visible colour; sectioning is the main time cost. Pre-lightening is needed for bright shades. | Lieliski sader ar košiem, vara vai platīna akcentiem zem dabiskajiem matiem. Piemērots jebkuram sākuma līmenim. Lielisks risinājums, ja darbavietas noteikumi ierobežo spilgtas matu krāsas; visvairāk laika prasa šķipsnu dalīšana. Spilgtiem toņiem nepieciešama iepriekšēja gaišināšana. | 7428a7b4 |  |
| grey-blending.name | Grey blending | Grey blending | 52e1dec3 | same |
| grey-blending.client | Lights and lowlights that blend with your natural grey instead of covering it, for a soft grow-out. | Gaišākas un tumšākas šķipsnas, kas saplūst ar taviem dabiskajiem sirmajiem matiem, nevis tos pilnībā nosedz, nodrošinot maigu ataugšanu. | 272d135c |  |
| grey-blending.stylist | Pairs with the grey-blend shades, beige, sandy or soft brunette. Best when starting from about 20-60% grey. Often best at lower to middle grey percentages; tone, grey texture and desired visibility of grey decide the approach. A strand test is useful. | Lieliski sader ar sirmo matu sapludināšanas toņiem, bēšajiem, smilšu vai maigi brūnajiem toņiem. Vislabāk piemērots, ja sirmo matu īpatsvars ir ap 20–60%. Bieži vien vislabāk darbojas pie zema vai vidēja sirmo matu daudzuma; pieeju nosaka tonis, sirmo matu tekstūra un tas, cik pamanāmus sirmos matus vēlas atstāt. Noderīgi veikt šķipsnas testu. | 9192faff | safety; checked |
| grey-coverage.name | Grey coverage (root colour) | Sirmo matu nokrāsošana (sakņu krāsošana) | ad67bc58 |  |
| grey-coverage.client | Permanent colour applied to the regrowth to cover grey. Very resistant grey can need extra steps. | Noturīga matu krāsa ataugušajām saknēm, lai pilnībā nokrāsotu sirmos matus. Grūtāk nokrāsojamiem sirmiem matiem var būt vajadzīga papildu apstrāde. | c37dab58 |  |
| grey-coverage.stylist | Pairs with level 3-7 natural-looking shades and a warm or neutral base. Best when starting from roots with grey. Percentage and texture of grey affect which formula is needed; very resistant grey may need extra steps. Skin test before every use. | Lieliski sader ar 3.–7. līmeņa dabiska izskata toņiem un siltu vai neitrālu bāzi. Vislabāk piemērots ataugušām sirmām saknēm. Formulas izvēli ietekmē sirmo matu īpatsvars un tekstūra; ļoti nepakļāvīgiem sirmiem matiem var būt nepieciešami papildu soļi. Pirms katras lietošanas reizes jāveic ādas tests. | 4f01ece9 | safety; checked |
| colour-correction.name | Colour correction | Krāsas korekcija | 06bbd4f6 |  |
| colour-correction.client | A colourist's plan to put right colour that is patchy, banded, too dark, too brassy or damaged. | Kolorista izstrādāts plāns, lai labotu nevienmērīgu, svītrainu, pārāk tumšu, nevēlami siltu vai bojātu matu krāsojumu. | 850689ba |  |
| colour-correction.stylist | Depends on the case. Professional only: needs in-person assessment, strand test and realistic aims; outcomes are not promised and the sequence is decided case by case. | Atkarīgs no situācijas. Tikai pie profesionāļa: nepieciešams klātienes novērtējums, šķipsnas tests un reālistiski mērķi; rezultāts netiek garantēts, un secību nosaka katram gadījumam individuāli. | 0ecf3bfb | safety; checked |
| vivid-all-over.name | Vivid all-over colour | Koša matu krāsa visā garumā | 669988f9 |  |
| vivid-all-over.client | A bright fashion colour all over, usually on hair that has been lightened first. It fades quickly. | Spilgts, košs tonis visos matos, ko parasti klāj uz iepriekš balinātiem matiem. Tas diezgan ātri izmazgājas. | 6155c075 |  |
| vivid-all-over.stylist | Pastel shades need very pale bases; deeper vivids (cherry red, plum, midnight blue) can show on darker bases at lower brightness. Best when starting from level 8-10 or pre-lightened. Base level and previous colour decide the end result; bright colours on dark hair usually need lightening. Dyes may stain skin and fabrics. | Pasteļtoņiem nepieciešama ļoti gaiša bāze; piesātinātāki košie toņi (ķiršu sarkanais, plūmju, pusnakts zilais) uz tumšākām bāzēm būs redzami, taču mazāk spilgti. Vislabāk piemērots, sākot no 8.–10. līmeņa vai iepriekš gaišinātiem matiem. Bāzes līmenis un iepriekšējā matu krāsa nosaka gala rezultātu; spilgtām krāsām uz tumšiem matiem parasti nepieciešama gaišināšana. Krāsas var notraipīt ādu un audumus. | 39a5293a |  |
| demi-refresh.name | Demi/semi-permanent refresh (tone-on-tone) | Tonēšana tonis tonī (atsvaidzināšana) | 6462d728 |  |
| demi-refresh.client | A gentle, tone-on-tone colour that revives depth and shine and fades without a hard line. | Saudzīga matu krāsošana tonis tonī, kas atjauno krāsas dziļumu un spīdumu un izmazgājas bez krasas pārejas līnijas. | f68ae262 |  |
| demi-refresh.stylist | Pairs with any shade at or darker than the current level. Suits any starting level. A good test-drive for clients unsure about commitment; limited grey coverage (blends rather than covers). | Lieliski sader ar jebkuru toni, kas ir pašreizējā līmenī vai tumšāks. Piemērots jebkuram sākuma līmenim. Lielisks izmēģinājums klientiem, kuri vēl nav gatavi pastāvīgām pārmaiņām; ierobežota sirmo matu segtspēja (drīzāk sapludina, nevis pilnībā noklāj). | 321cca9f |  |
| frohawk.name | Frohawk | Frohawk | 0e592283 | same |
| frohawk.texture_fit.straight.note | not recommended | nav ieteicams | 649cfa2f |  |
| frohawk.density_fit.low.note | very fine coils lose definition on top, keep them moist | ļoti smalkas sīkās cirtas augšpusē zaudē formu, regulāri tās mitrini | 2b76febb |  |
| frohawk.growth.note | A crown whorl may bend the strip, so shape the length around it. | Matu virpulis galvvidū var izliekt joslu, tāpēc pielāgo garumu ap to. | e685e94a |  |
| frohawk.strand_note | Works on defined coils and curls that stand up. | Piemērots izteiksmīgām cirtām un sīkām cirtām, kas tur formu. | 68e763e6 |  |
| frohawk.upkeep.products.0 | curl-defining custard | loku definēšanas krēms-želeja | 18a618c5 |  |
| frohawk.upkeep.products.1 | light oil | viegla eļļa | 7170b5ea |  |
| frohawk.grow_out | The sides grow in over 6-8 weeks and the cut becomes a tapered curly crop. | Sāni ataug 6–8 nedēļu laikā, un griezums pārtop par cirtainu taper crop. | fab64e0f |  |
| frohawk.client | A short cut with a strip of curls on top and close-cropped sides. | Īss griezums ar cirtu joslu augšpusē un ļoti īsiem sāniem. | b318ee10 |  |
| frohawk.stylist | Blend a taper or fade into a central strip about 4-6 cm wide at the temples, and keep the top at the finish length. Weight: the length is kept on top in a central strip and the sides are cropped. | Sapludini taper vai fade pāreju ar centrālo joslu, kas pie deniņiem ir aptuveni 4–6 cm plata, un saglabā augšpusi vēlamajā garumā. Apjoma sadalījums: garums tiek saglabāts augšpusē centrālajā joslā, bet sāni ir īsi apgriezti. | 4699b003 |  |
| tapered-twa.name | Tapered TWA | Tapered TWA | 5c40a364 | same |
| tapered-twa.texture_fit.straight.note | not recommended; choose micro-pixie | nav ieteicams; izvēlies micro-pixie | 290741aa |  |
| tapered-twa.texture_fit.wavy.note | not recommended; choose micro-pixie | nav ieteicams; izvēlies micro-pixie | 290741aa |  |
| tapered-twa.texture_fit.curly.note | loose curls need a longer top; see Curly pixie | vaļīgākām cirtām vajadzīga garāka augšpuse; skaties: Cirtainais pixie | fbd7cabe |  |
| tapered-twa.density_fit.low.note | very fine coils show scalp at this length, so keep the top denser | ļoti smalkām sīkajām cirtām šādā garumā spīd cauri galvas āda, tāpēc atstāj augšpusi biezāku | af658b2d |  |
| tapered-twa.growth.note | Shape the taper around the hairline and nape whorl; short coils follow the whorl direction. | Veido taper pāreju gar matu augšanas līniju un kakla virpuli; īsās cirtas seko virpuļa virzienam. | a349dca7 |  |
| tapered-twa.strand_note | Dense coils give the cut its shape; fine coils need more length on top. | Biezas, sīkas cirtas piešķir griezumam formu; smalkākām cirtām augšpusē vajadzīgs lielāks garums. | 53b7c6aa |  |
| tapered-twa.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| tapered-twa.upkeep.products.1 | light oil | viegla eļļa | 7170b5ea |  |
| tapered-twa.grow_out | Grows into a rounded fro over about 8 weeks, then into the shaped round afro. | Apmēram 8 nedēļu laikā tas ataug par noapaļotu afro, bet pēc tam — par veidotu apaļo afro. | e723a2c7 |  |
| tapered-twa.client | A short, rounded natural cut with neat tapered sides. Almost wash and go. | Īss, noapaļots dabisko cirtu griezums ar glītām taper pārejām sānos. Praktiski gatavs pēc izmazgāšanas. | b2697ed7 |  |
| tapered-twa.stylist | Define the taper at the nape, around the ears and at the temples with clippers, then cut the crown to a rounded shape, allowing for 50 percent or more shrinkage. Weight: tight at the nape and around the ears, with a rounded crown left longer. | Ar mašīnīti iezīmē taper pāreju uz kakla, ap ausīm un pie deniņiem, pēc tam piegriez galvvidu noapaļotā formā, rēķinoties ar 50 procentu vai lielāku saraušanos. Apjoma sadalījums: īsi pie kakla un ap ausīm, atstājot noapaļotu, garāku galvvidu. | 15ddd13f |  |
| tapered-twa.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| shaped-round-twa.name | Shaped round crop | Noapaļots crop griezums | fa8c0679 |  |
| shaped-round-twa.texture_fit.straight.note | not recommended | nav ieteicams | 649cfa2f |  |
| shaped-round-twa.texture_fit.wavy.note | not recommended | nav ieteicams | 649cfa2f |  |
| shaped-round-twa.density_fit.low.note | fine coils show thinner areas on the sides, so keep length even | smalkām sīkajām cirtām sānos mati var izskatīties retāki, tāpēc saglabā vienmērīgu garumu | 139c0366 |  |
| shaped-round-twa.growth.note | Reshape around cowlicks or whorls so the shape stays round. | Pielāgo griezumu ap virpuļiem un nepakļāvīgām šķipsnām, lai forma saglabātos apaļa. | 8af26e11 |  |
| shaped-round-twa.strand_note | Even coil density keeps the round shape. | Vienmērīgs sīko cirtu biezums palīdz noturēt apaļo formu. | 5416d84e |  |
| shaped-round-twa.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| shaped-round-twa.upkeep.products.1 | light oil | viegla eļļa | 7170b5ea |  |
| shaped-round-twa.grow_out | The shape grows out into a larger round afro. | Ataugot forma pārtop par lielāku, apaļu afro. | 37677621 |  |
| shaped-round-twa.client | A short natural cut with the same length all around the head, forming a neat circle. | Īss dabisko cirtu griezums vienādā garumā visapkārt galvai, veidojot glītu, apaļu formu. | 34166f5b |  |
| shaped-round-twa.stylist | Cut dry, using the shortest area at the front as the guide, and carry the length evenly around the head. Check the circle from the front, side and back. Weight: the same short length all around in a round shape. | Griez sausos matos, par vadlīniju izmantojot īsāko zonu priekšpusē, un vienmērīgi saglabā šo garumu visapkārt galvai. Pārbaudi apaļo formu no priekšpuses, sāniem un aizmugures. Apjoma sadalījums: vienāds īss garums visapkārt apaļā formā. | d3b8d686 |  |
| shaped-round-twa.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| shaped-round-afro.name | Shaped round afro | Noapaļots afro | 7c97b538 |  |
| shaped-round-afro.texture_fit.curly.note | needs tight curls for volume | apjomam nepieciešamas stingras cirtas | 59c740e3 |  |
| shaped-round-afro.density_fit.low.note | fine coils look sparse in a round shape, so keep density | smalkas sīkās cirtas apaļā formā izskatās retas, tāpēc saglabā biezumu | b01ea638 |  |
| shaped-round-afro.growth.note | Shape around the hairline and nape whorl so the circle stays even. | Veido formu gar matu augšanas līniju un kakla virpuli, lai apaļā līnija saglabātos vienmērīga. | fbc769a6 |  |
| shaped-round-afro.strand_note | Dense coils give the circular shape; looser coils lose it. | Biezas, sīkas cirtas palīdz noturēt apaļo formu; vaļīgākas cirtas to zaudē. | 6aaa9cd9 |  |
| shaped-round-afro.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| shaped-round-afro.upkeep.products.1 | styling cream | ieveidošanas krēms | 01654a1c |  |
| shaped-round-afro.grow_out | The shape grows out evenly, with only the perimeter needing trimming. | Griezums ataug vienmērīgi, un jāpielīdzina tikai kontūra. | 09783839 |  |
| shaped-round-afro.client | A full, round natural shape with even volume all the way around. | Apjomīga, noapaļota dabiska forma ar vienmērīgu kuplumu visapkārt galvai. | 6a71803a |  |
| shaped-round-afro.stylist | Cut the shape dry by picking out the hair and checking the outline from every side. Weight: an even, circular outline around the head. | Griez formu sausos matos, paceļot matus ar afro ķemmi un pārbaudot kontūru no visām pusēm. Apjoma sadalījums: vienmērīga, apaļa kontūra visapkārt galvai. | 3d79373c |  |
| shaped-round-afro.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| diamond-shape-afro.name | Diamond-shape afro | Rombveida afro | 3db861b3 |  |
| diamond-shape-afro.texture_fit.curly.note | needs tight curls; see Curly short shag | nepieciešamas stingras cirtas; skaties: Cirtainais īsais shag | a05cf7f1 |  |
| diamond-shape-afro.density_fit.low.note | fine coils lose the diamond edges, so keep density at the cheeks | smalkas sīkās cirtas zaudē romba līniju, tāpēc vaigu zonā saglabā biezumu | 5b4e0253 |  |
| diamond-shape-afro.growth.note | Check the temples and nape for whorls that may disturb the narrow edges. | Pārbaudi deniņus un kakla līniju, vai tur nav virpuļu, kas varētu izjaukt šaurās malas. | 0bdd2f1f |  |
| diamond-shape-afro.strand_note | Dense, well-defined coils keep the diamond edges crisp; looser textures round them off. | Biezas, izteiksmīgas sīkās cirtas notur skaidru romba siluetu; vaļīgāka tekstūra to noapaļo. | 2d519860 |  |
| diamond-shape-afro.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| diamond-shape-afro.upkeep.products.1 | styling cream | ieveidošanas krēms | 01654a1c |  |
| diamond-shape-afro.grow_out | The narrow areas fill in over 6-8 weeks, turning the diamond into a rounded fro; trim the temples first to keep the shape. | Šaurākās vietas ataug 6–8 nedēļu laikā, pārvēršot romba siluetu apaļā afro; lai saglabātu formu, vispirms pielīdzini deniņus. | a610559d |  |
| diamond-shape-afro.client | A shaped natural cut with the most width at the cheeks and a neater, narrower line at the temples and nape. | Veidots dabisko cirtu griezums ar platāko daļu pie vaigiem un šaurāku, precīzāku līniju deniņos un pakausī. | 6a51a960 |  |
| diamond-shape-afro.stylist | Pick out the hair, trim the widest part at cheek level, then taper the temples and nape inward in steps. Check the silhouette from the front and side before finishing. Weight: width is greatest at the cheeks, narrowing at the temples and nape. | Pacel matus ar afro ķemmi, pielīdzini platāko daļu vaigu līmenī, pēc tam pakāpeniski sašaurini deniņus un kakla zonu virzienā uz iekšu. Pirms pabeigšanas pārbaudi siluetu no priekšpuses un profila. Apjoma sadalījums: lielākais platums ir vaigu zonā, kas sašaurinās pie deniņiem un kakla. | d4c8e974 |  |
| diamond-shape-afro.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| afro-taper-round.name | Rounded afro with taper | Noapaļots afro ar taper pāreju | 4b6875d8 |  |
| afro-taper-round.fade.note | Taper at the sides and nape; round shape on top. | Taper pāreja sānos un pakausī; noapaļota forma augšpusē. | 60e2fb1f |  |
| afro-taper-round.sideburns | Tapered | Ar taper pāreju | dcbacddd |  |
| afro-taper-round.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| afro-taper-round.texture_fit.wavy.note | Not suited: waves lack the volume. | Nav piemērots: viļņainiem matiem trūkst apjoma. | b4b9c14f |  |
| afro-taper-round.texture_fit.curly.note | Loose curls shape into an afro with pick. | Vaļīgākas cirtas var ieveidot afro formā, izmantojot afro ķemmi. | 397d7ffc |  |
| afro-taper-round.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| afro-taper-round.density_fit.low.note | Keep the shape smaller and rounder so the scalp shows less. | Veido formu mazāku un apaļāku, lai mazāk spīdētu cauri galvas āda. | 8832bf58 |  |
| afro-taper-round.growth.note | Rounded volume covers temples. | Apaļais apjoms nosedz deniņus. | da5182ab |  |
| afro-taper-round.density_note | Medium to thick; very fine coils need extra moisture to hold shape. | Vidēji līdz biezi mati; ļoti smalkām cirtām nepieciešams papildu mitrums, lai saglabātu formu. | c1eb09f1 |  |
| afro-taper-round.glasses_note | Sits well with most frames; keep hair above the ear short so the arms rest cleanly. | Labi sader ar lielāko daļu rāmju; virs ausīm matus atstāj īsus, lai briļļu kājiņas ērti piegultu. | 267e7433 |  |
| afro-taper-round.upkeep.products.0 | pick | afro ķemme | 8ce33c6c |  |
| afro-taper-round.upkeep.products.1 | oil | eļļa | ab7902bc |  |
| afro-taper-round.grow_out | Easy: the taper grows in 3-4 weeks. | Vienkārši: taper pāreja ataug 3–4 nedēļu laikā. | b0433374 |  |
| afro-taper-round.client | A rounded natural afro with neat tapered edges at the sides and neck. | Noapaļots dabisko cirtu afro ar glītām taper pārejām sānos un pie kakla. | 18f47876 |  |
| afro-taper-round.stylist | Pick out, shape the round outline with scissors and clipper-taper the sides and nape; avoid razor edges on tight coils. | Pacel matus ar afro ķemmi, ar šķērēm izveido apaļu kontūru un ar mašīnīti veido taper pāreju sānos un pie kakla; sīkām cirtām izvairies no asām skuvekļa līnijām. | 375f4d09 |  |
| afro-blowout.name | Afro blowout | Afro blowout | e46f6e24 | same |
| afro-blowout.sideburns | Natural | Dabiskas | d6acb6d5 |  |
| afro-blowout.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| afro-blowout.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| afro-blowout.texture_fit.curly.note | Works with a stretched blow-dry; the finish is looser. | Iespējams ieveidot, fēnojot un izstiepjot matus; rezultāts būs vaļīgāks. | 20d6a41e |  |
| afro-blowout.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| afro-blowout.density_fit.low.note | Keep it smaller and rounder; a large blowout shows the scalp when density is low. | Izvēlies mazāku un apaļāku formu – ja mati nav biezi, lielā blowout formā spīdēs cauri galvas āda. | da601076 |  |
| afro-blowout.growth.note | Volume covers temples at stage 3-4; the surrounding mass distracts from a thin crown. | 3.–4. stadijā apjoms nosedz deniņus; apkārtējā matu masa novērš uzmanību no retāka galvvidus. | 2b750d51 |  |
| afro-blowout.density_note | Thick density; fine coils lose shape. | Biezi mati; smalkas cirtas zaudē formu. | 9228594f |  |
| afro-blowout.glasses_note | Hair may curl or drop over the arms of glasses; trim a clean channel behind the ear if frames sit on top of the hair. | Mati var lokoties vai krist pāri briļļu kājiņām; aiz ausīm izveido tīru līniju, ja rāmis balstās uz matiem. | b7f64717 |  |
| afro-blowout.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| afro-blowout.upkeep.products.1 | pick | afro ķemme | 8ce33c6c |  |
| afro-blowout.grow_out | Let it grow: a blowout can reach 20+ cm and be shaped into twists or a puff. | Ļauj matiem augt: blowout var sasniegt 20+ cm un to var ieveidot twists vai puff frizūrā. | b70f2a6e |  |
| afro-blowout.client | A large, soft, round afro blown out and picked. Voluminous and expressive. | Liels, mīksts un apaļš afro, kas izfēnots un izķemmēts ar afro ķemmi. Apjomīgs un izteiksmīgs. | fb66bde3 |  |
| afro-blowout.stylist | Detangle, stretch with a blow-dryer and comb, pick the volume out evenly and trim the outline with scissors. Never razor-cut dry coils. | Atšķetini matus, izstiep ar fēnu un ķemmi, vienmērīgi pacel apjomu ar afro ķemmi un pielīdzini kontūru ar šķērēm. Nekad negriez sausas, sīkas cirtas ar skuvekli. | 9e403e82 |  |
| afro-burst-taper.name | Afro with burst taper | Afro ar burst taper pāreju | 4a9a2b86 |  |
| afro-burst-taper.fade.note | Burst arc around the ears; natural afro on top. | Burst loka pāreja ap ausīm; dabisks afro augšpusē. | 44c50d17 |  |
| afro-burst-taper.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| afro-burst-taper.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| afro-burst-taper.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| afro-burst-taper.texture_fit.curly.note | Works with a stretched top and curl cream. | Piemērots, ja augšpusi izstiepj un ieveido ar cirtu krēmu. | f7bf4657 |  |
| afro-burst-taper.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| afro-burst-taper.density_fit.low.note | Keep the afro compact so the top looks full above the fade. | Saglabā afro kompaktāku, lai augšpuse virs pārejas izskatītos bieza. | 2700becc |  |
| afro-burst-taper.growth.note | Fine for stage 3-4; the volume covers the temples. | Piemērots 3.–4. stadijai; apjoms nosedz deniņus. | 6d897497 |  |
| afro-burst-taper.density_note | Medium to thick density. | Vidēji biezi līdz biezi mati. | cbe59eb6 |  |
| afro-burst-taper.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| afro-burst-taper.upkeep.products.0 | pick | afro ķemme | 8ce33c6c |  |
| afro-burst-taper.upkeep.products.1 | oil | eļļa | ab7902bc |  |
| afro-burst-taper.grow_out | Let the fade grow in about 4 weeks; it becomes a rounded taper afro. | Ļauj fade ataugt apmēram 4 nedēļas; tas pārtop par noapaļotu taper afro. | 62ab81f0 |  |
| afro-burst-taper.client | An afro with a curved fade around the ears. Bold, shapely and neat. | Afro ar pusloka pāreju ap ausīm. Drosmīgs, izteiksmīgas formas un sakopts griezums. | da86d233 |  |
| afro-burst-taper.stylist | Arc the fade around the ear and keep the rest natural. Keep the nape longer than the sides. | Veido loka veida fade ap ausi un pārējos matus atstāj dabiskus. Kakla daļā atstāj garākus matus nekā sānos. | d29b1df4 |  |
| afro-puff-taper.name | Afro puff with taper | Afro puff ar taper pāreju | 3f026e4d |  |
| afro-puff-taper.fade.note | Tapered sides; top gathered into a puff. | Sāni ar taper pāreju; augšpusē mati saņemti puff astē. | fb609887 |  |
| afro-puff-taper.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| afro-puff-taper.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| afro-puff-taper.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| afro-puff-taper.texture_fit.curly.note | Works with a stretched top and a gel; softer puff. | Piemērots, ja augšpusi izstiepj un ieveido ar želeju; rezultāts ir maigāks puff. | fb0ed29e |  |
| afro-puff-taper.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| afro-puff-taper.density_fit.low.note | Gather a smaller, looser puff and avoid pulling at the hairline. | Veido mazāku, brīvāku puff un nesavelc matus pārāk cieši pie matu augšanas līnijas. | 2f3e1015 |  |
| afro-puff-taper.growth.note | Pulling back shows the hairline. | Saņemot matus atpakaļ, atsedzas matu augšanas līnija. | be8b21ce |  |
| afro-puff-taper.density_note | Medium to thick; the top needs enough density to gather. | Vidēji biezi līdz biezi mati; augšpusē nepieciešams pietiekams biezums, lai tos varētu saņemt kopā. | 73bdf61e |  |
| afro-puff-taper.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| afro-puff-taper.upkeep.products.0 | gel | želeja | cdc00f6c |  |
| afro-puff-taper.upkeep.products.1 | elastic | matu gumija | 98605138 |  |
| afro-puff-taper.grow_out | Let the sides grow and release the puff: it becomes a full afro in about 8 weeks. | Ļauj sāniem ataugt un izlaid matus no puff: apmēram 8 nedēļās tas pārtaps par pilnu afro. | dd7b1ca3 |  |
| afro-puff-taper.client | Tapered sides and long top gathered into a puff. Practical and distinctive. | Sāni ar taper pāreju un garāki mati augšpusē, kas saņemti kuplā puff astē. Praktisks un izteiksmīgs. | a5f0dd97 |  |
| afro-puff-taper.stylist | Fade the sides to #1-#2, leave 12-20 cm on top, stretch it and gather it with a soft elastic. Keep edges free of tension. | Veido fade sānos ar #1–#2 uzgali, augšpusē atstāj 12–20 cm, izstiep un saņem ar mīkstu matu gumiju. Matu augšanas līniju atstāj bez lieka iestiepuma. | c6f0035c |  |
| shaped-fro-curly-fringe.name | Shaped fro with a curly fringe | Formēts afro ar cirtainiem priekšmatiem | 96bb8830 |  |
| shaped-fro-curly-fringe.texture_fit.straight.note | not recommended | nav ieteicams | 649cfa2f |  |
| shaped-fro-curly-fringe.texture_fit.wavy.note | not recommended | nav ieteicams | 649cfa2f |  |
| shaped-fro-curly-fringe.texture_fit.curly.note | needs tight 3C curls for the shape | formai nepieciešamas stingras 3C cirtas | 93b5dd5f |  |
| shaped-fro-curly-fringe.texture_fit.coily.note | on 4C hair the fringe stands out instead of falling | 4C tipa matos priekšmati paceļas uz priekšu, nevis krīt uz leju | a60854bc |  |
| shaped-fro-curly-fringe.density_fit.low.note | fine coils look sparse in a round shape, so keep the density | smalkas, sīkas cirtas apaļā formā izskatās retas, tāpēc saglabā biezumu | a352581a |  |
| shaped-fro-curly-fringe.growth.note | Shape around the hairline and any cowlick so the fringe sits evenly. | Pielāgo formu matu augšanas līnijai un virpuļiem, lai priekšmati gulētu vienmērīgi. | 999f245c |  |
| shaped-fro-curly-fringe.strand_note | Dense 4A to 4B coils give the best shape. Fine strands look sparse. | Vislabāko formu veido biezas 4A līdz 4B sīkās cirtas. Smalki mati izskatās reti. | a0e632fe |  |
| shaped-fro-curly-fringe.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| shaped-fro-curly-fringe.upkeep.products.1 | styling cream | ieveidošanas krēms | 01654a1c |  |
| shaped-fro-curly-fringe.grow_out | The shape grows out evenly, and the fringe joins the round shape in about 8 to 10 weeks. | Forma ataug vienmērīgi, un priekšmati iekļaujas apaļajā formā apmēram 8 līdz 10 nedēļu laikā. | 711b68c4 |  |
| shaped-fro-curly-fringe.client | A rounded natural shape with a curly fringe, shorter in the middle and longer at the sides. Dry, the shape sits 4 to 12 cm off the head and the fringe 4 to 9 cm. | Noapaļota, dabiska forma ar cirtainiem priekšmatiem — vidū īsākiem, bet sānos garākiem. Kad mati ir sausi, forma paceļas 4 līdz 12 cm no galvas, un priekšmati — 4 līdz 9 cm. | e8de4387 |  |
| shaped-fro-curly-fringe.stylist | Cut the rounded shape dry. Cut the fringe shorter at the centre and longer at the sides, and allow for shrinkage: a fringe cut at 8 cm springs back to 2-4 cm. Plan for 50-70% shrinkage, so the shape lands about 4-12 cm off the head. On 4C hair the fringe stands out instead of falling. Weight: a round shape with a fringe that stands off the forehead. | Apaļo formu griez sausos matos. Priekšmatus griez īsākus centrā un garākus sānos, un ņem vērā saraušanos: 8 cm garumā nogriezti priekšmati saraujas līdz 2–4 cm. Rēķinies ar 50–70% saraušanos, lai forma atrastos apmēram 4–12 cm no galvas. 4C tipa matos priekšmati paceļas uz priekšu, nevis krīt uz leju. Svars: apaļa forma ar priekšmatiem, kas atstāv no pieres. | 58216001 |  |
| shaped-fro-curly-fringe.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| blunt-chin-bob.name | Blunt chin bob | Blunt bobs līdz zodam | 31723801 |  |
| blunt-chin-bob.texture_fit.wavy.note | cut dry or with a light hand, waves pull the line up unevenly | griez sausos matos vai ar vieglu roku — viļņi līniju saraus nevienmērīgi | f91c1d92 |  |
| blunt-chin-bob.texture_fit.curly.note | blunt lines turn triangular on curls, use curly-bob-rounded | taisnas līnijas cirtās iegūst trijstūra formu; izvēlies curly-bob-rounded | ade20f91 |  |
| blunt-chin-bob.texture_fit.coily.note | use coily-sculpted-chin-bob | izvēlies coily-sculpted-chin-bob | c8a4f376 |  |
| blunt-chin-bob.density_fit.high.note | take internal weight out behind the ears; never razor the ends | noņem iekšējo biezumu aiz ausīm; nekad negriez galus ar skuvekli | 0e96c8b0 |  |
| blunt-chin-bob.growth.note | Check nape growth and crown whorl so the line does not kick out at the back. | Pārbaudi matu augšanas virzienu uz kakla un virpuli galvvidū, lai līnija aizmugurē neliektos uz āru. | d10dff09 |  |
| blunt-chin-bob.strand_note | Fine strands look denser with a hard edge; thick strands need internal debulking so the line does not flare. | Smalki mati ar stingru griezuma līniju izskatās biezāki; bieziem matiem jānoņem iekšējais biezums, lai līnija neizplestos uz āru. | 244e57d1 |  |
| blunt-chin-bob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| blunt-chin-bob.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| blunt-chin-bob.grow_out | Reaches a lob in 3-4 months; trim the perimeter every 6-8 weeks to stop the ends flaring. | Pārtop par lob griezumu 3–4 mēnešu laikā; pielīdzini matu galus pa perimetru ik pēc 6–8 nedēļām, lai tie neliektos uz āru. | b57ea76b |  |
| blunt-chin-bob.client | A crisp, one-length bob at the chin that makes hair look thicker and glossier. Best with a quick blow-dry. | Precīzs, viena garuma bobs līdz zodam, kas liek matiem izskatīties biezākiem un spīdīgākiem. Vislabāk izskatās, ātri izžāvējot ar fēnu. | 7f82a349 |  |
| blunt-chin-bob.stylist | Cut the back first, set the weight line at the chin, then connect the sides at a slight forward angle with tension-free sections. Check the line by eye with the head level. Weight: heavy, even weight sitting exactly on the perimeter. | Vispirms griez aizmuguri, iezīmē masas līniju zoda līmenī, tad savieno sānus nelielā leņķī uz priekšu, griežot šķipsnas bez iestiepuma. Vizuāli pārbaudi līniju, turot galvu taisni. Svars: smaga, vienmērīga masa tieši pa perimetru. | 9da9fe85 |  |
| micro-bob.name | Micro bob | Mikrobobs | 34860c97 |  |
| micro-bob.texture_fit.wavy.note | short waves bounce up, keep the perimeter slightly longer at the back | īsi viļņi saraujas, tāpēc aizmugurē kontūru atstāj nedaudz garāku | 297e6c0c |  |
| micro-bob.texture_fit.curly.note | too short for curl spring, see curly-bob-rounded | pārāk īss cirtu atsperīgumam; skatīt curly-bob-rounded | e2ec01a8 |  |
| micro-bob.texture_fit.coily.note | too short to allow for coil shrinkage; see coily-sculpted-chin-bob or tapered-twa | pārāk īss sīko cirtu saraušanās dēļ; skatīt coily-sculpted-chin-bob vai tapered-twa | e6b98395 |  |
| micro-bob.density_fit.high.note | thin the nape because thick hair flares at this length | izplānini pakausi, jo biezi mati šādā garumā mēdz izplesties | f6e27dbe |  |
| micro-bob.growth.note | A short back shows any nape whorl or low hairline. | Īsa aizmugure atsedz jebkuru virpuli pie kakla vai zemu matu augšanas līniju. | 06745041 |  |
| micro-bob.strand_note | Short length makes strand texture obvious: fine hair looks sleek, coarse hair looks fuller. | Īss garums izceļ matu tekstūru: smalki mati izskatās gludi, bet raupji — kuplāki. | 2b3c21d8 |  |
| micro-bob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| micro-bob.upkeep.products.1 | light mousse | vieglas fiksācijas putas | afc8a642 |  |
| micro-bob.grow_out | Becomes a chin bob after about two months. | Apmēram pēc diviem mēnešiem pārtop par zoda garuma bobu. | d1fa126b |  |
| micro-bob.client | A very short bob that sits at the upper jaw. Bold, graphic and quick to dry. | Ļoti īss bobs, kas sniedzas līdz žokļa augšdaļai. Drosmīgs, grafisks un ātri žūst. | 23c24fa8 |  |
| micro-bob.stylist | Cut the line at the upper jaw with a tight, slightly forward-angled perimeter and check balance from the profile so the front does not look heavier than the back. Weight: weight at the upper jaw, line rising a little at the front. | Griez līniju augšžokļa līmenī ar precīzu, nedaudz uz priekšu vērstu perimetru un pārbaudi līdzsvaru profilā, lai priekšpuse neizskatītos smagāka par aizmuguri. Svars: masa augšžokļa līmenī, līnija priekšpusē nedaudz paceļas. | 94106b8e |  |
| french-bob.name | French bob | Franču bobs | 32c47741 |  |
| french-bob.texture_fit.curly.note | use a fringe long enough to allow for spring | atstāj priekšmatus pietiekami garus, rēķinoties ar cirtu saraušanos | aa64efa2 |  |
| french-bob.texture_fit.coily.note | use curly-bob-with-fringe | izvēlies curly-bob-with-fringe | 49140390 |  |
| french-bob.density_fit.high.note | take weight out of the interior | noņem biezumu iekšpusē | 60889df0 |  |
| french-bob.growth.note | Check the front hairline for a cowlick before cutting a short fringe. | Pirms īsu priekšmatu griešanas pārbaudi, vai pie pieres matu augšanas līnijas nav virpuļa. | b540250b |  |
| french-bob.strand_note | Fine hair suits the airy ends; thick hair needs interior weight removed. | Smalkiem matiem piestāv gaisīgi gali; bieziem matiem jānoņem biezums iekšpusē. | 2c7e5ee9 |  |
| french-bob.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| french-bob.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| french-bob.grow_out | Grow the fringe out through a curtain stage; the bob becomes a lob. | Ataudzē priekšmatus caur curtain bangs posmu; bobs pārtop par lob griezumu. | ad9ae96f |  |
| french-bob.client | A chin-length bob with airy ends and a short, wispy fringe at the brows. Easy to wear a little tousled. | Bobs līdz zodam ar gaisīgiem galiem un īsiem, viegliem priekšmatiem līdz uzacīm. Ērti nēsāt arī viegli izspūrušu. | c10a4832 |  |
| french-bob.stylist | Cut a clean perimeter at the chin, point-cut the ends for a light feel, then cut the fringe dry at the brow, slightly wispy. Weight: light weight at the chin, ends slightly airy. | Izveido precīzu perimetru zoda līmenī, iefrēzē galus ar point-cut tehniku vieglākam kritumam, pēc tam sausos matos nogriez gaisīgus priekšmatus uzacu līmenī. Svars: viegla masa zoda līmenī, gali nedaudz gaisīgi. | 7358e7d8 |  |
| italian-bob.name | Italian bob | Itāļu bobs | fe579213 |  |
| italian-bob.texture_fit.curly.note | good on loose curls, graduate inside only | piemērots vieglām cirtām; graduē tikai iekšpusē | 7ca518fa |  |
| italian-bob.texture_fit.coily.note | keep the length so the curl can bounce | saglabā garumu, lai cirtas būtu atsperīgas | b728cbb4 |  |
| italian-bob.density_fit.low.note | avoid heavy layers, they take out volume | izvairies no izteiktām pakāpēm — tās noņem apjomu | f0a98caa |  |
| italian-bob.density_fit.high.note | remove weight from the sides | noņem biezumu sānos | 8a7be57c |  |
| italian-bob.growth.note | Crown whorl may lift the top, so cut slightly longer there. | Virpulis galvvidū var pacelt matus, tāpēc augšpusē griez nedaudz garākus. | 087ca356 |  |
| italian-bob.strand_note | Fine hair gains volume from the rounded shape; thick hair needs interior thinning. | Smalki mati iegūst apjomu no apaļās formas; bieziem matiem jānoņem biezums iekšpusē. | c60a2050 |  |
| italian-bob.upkeep.products.0 | volumising mousse | apjoma putas | 07b4f2db |  |
| italian-bob.upkeep.products.1 | blow-dry cream | fēnošanas krēms | 8640b75b |  |
| italian-bob.grow_out | Grows into a soft lob; the graduation keeps the shape. | Ataug par maigu lob griezumu; graduācija saglabā formu. | e3c42ba6 |  |
| italian-bob.client | A fuller, rounded bob that curves softly under. It moves when you do. | Kuplāks, noapaļots bobs, kas maigi liecas uz iekšu. Tas kustas līdzi katrai tavai kustībai. | 260f34f3 |  |
| italian-bob.stylist | Build a shallow graduation through the back, keep the perimeter soft and curved, and leave the front slightly longer. Blow-dry with a round brush to turn the ends under. Weight: full rounded weight at the jaw with soft internal graduation. | Aizmugurē izveido vieglu graduāciju, saglabā perimetru mīkstu un noapaļotu, un priekšpusē atstāj nedaudz garākus matus. Fēno ar apaļo suku, ieliecot galus uz iekšu. Svars: pilnīga, noapaļota masa žokļa līmenī ar maigu iekšējo graduāciju. | dd2eed7e |  |
| graduated-bob.name | Graduated bob | Graduēts bobs | 74c9ae84 |  |
| graduated-bob.texture_fit.curly.note | graduation bulks the nape, see curly-wedge-bob | gradācija rada lieku apjomu pakausī; skatīt curly-wedge-bob | 4546dee3 |  |
| graduated-bob.texture_fit.coily.note | see coily-layered-midi-stacked | skatīt coily-layered-midi-stacked | 84166145 |  |
| graduated-bob.density_fit.low.note | too much stack looks thin | pārāk izteikts pacēlums liek matiem izskatīties plāniem | ab54f177 |  |
| graduated-bob.density_fit.high.note | thin the stack | samazini biezumu graduētajā pakausī | 4e5f74a0 |  |
| graduated-bob.growth.note | Check for a nape whorl, a frequent cause of a lifted nape. | Pārbaudi, vai pie kakla nav virpuļa — tas bieži liek matiem pakausī celties uz augšu. | ed447a27 |  |
| graduated-bob.strand_note | Fine hair fills out at the stack; coarse hair can stand away from the nape. | Smalki mati pacēlumā iegūst kuplumu; raupji mati var stāvēt atstatus no pakauša. | a05cd93b |  |
| graduated-bob.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| graduated-bob.upkeep.products.1 | smoothing serum | nogludinošs serums | 7074d46d |  |
| graduated-bob.grow_out | Grows into an A-line and then a lob; the stack softens. | Ataug par A-līnijas bobu un vēlāk par lob griezumu; graduētais pakausis kļūst maigāks. | bf096134 |  |
| graduated-bob.client | A bob shorter at the back and longer in the front, with a rounded shape. | Noapaļotas formas bobs, kas aizmugurē ir īsāks, bet priekšpusē garāks. | bf30d566 |  |
| graduated-bob.stylist | Cut a controlled graduation with a diagonal-back parting, increasing the stack toward the nape; cross-check horizontally and keep the interior bulk balanced. Weight: stacked weight at the occipital, sides longer. | Griez kontrolētu graduāciju ar diagonāliem dalījumiem uz aizmuguri, palielinot pakāpi virzienā uz kaklu; veic horizontālo pārbaudi un saglabā iekšējo apjomu līdzsvarā. Svars: graduēta masa pie pakauša kaula, sāni garāki. | 873f9d04 |  |
| wedge-bob.name | Wedge bob | Wedge bobs | b5a079bd |  |
| wedge-bob.texture_fit.curly.note | the stack turns into bulk on curls; see curly-wedge-bob | cirtās pacēlums rada nevajadzīgu smagumu; skatīt curly-wedge-bob | d740cdf6 |  |
| wedge-bob.texture_fit.coily.note | see asymmetric-coily-taper or coily-sculpted-chin-bob | skatīt asymmetric-coily-taper vai coily-sculpted-chin-bob | 0183c731 |  |
| wedge-bob.density_fit.low.note | fine hair can look flat | smalki mati var izskatīties pieplakuši | 59de0640 |  |
| wedge-bob.growth.note | A short nape exposes any whorl, so check how the nape hair grows before stacking. | Īss pakausis atsedz jebkuru virpuli, tāpēc pirms graduēšanas pārbaudi, kā mati aug pie kakla. | 746f5ae9 |  |
| wedge-bob.strand_note | A strong graduation needs enough strand strength to hold the stack. | Izteiktai gradācijai vajadzīgi pietiekami spēcīgi mati, lai noturētu pacēlumu. | 87299dbc |  |
| wedge-bob.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| wedge-bob.upkeep.products.1 | strong-hold spray | stipras fiksācijas laka | 6e2865d8 |  |
| wedge-bob.grow_out | Grows into a lob but keeps a visible stack for a long time. | Ataug par lob griezumu, taču ilgi saglabā pamanāmu graduāciju pakausī. | c31f4ef7 |  |
| wedge-bob.client | A structured bob, shorter at the back, with lots of body. | Strukturēts bobs, aizmugurē īsāks, ar izteiktu apjomu. | ec88d0e7 |  |
| wedge-bob.stylist | Establish the nape short, graduate fast to the sides, use a round brush for lift and keep the top lightly layered for body. Weight: tight stack at the back, very short nape, sides longer. | Izveido īsu kakla daļu, veido strauju graduāciju uz sāniem, izmanto apaļo suku apjomam pie saknēm un virspusē saglabā vieglas pakāpes kuplumam. Smagums: izteikti graduēts pakausis, ļoti īsa kakla daļa, garāki sāni. | 5177bd85 |  |
| a-line-bob.name | A-line bob | A-līnijas bobs | ec0772d6 |  |
| a-line-bob.texture_fit.curly.note | soften the diagonal on loose curls to avoid a heavy front | vieglās cirtās mīkstini diagonāli, lai priekšpuse nebūtu par smagu | 43f56dcd |  |
| a-line-bob.texture_fit.coily.note | see curly-a-line-bob | skatīt curly-a-line-bob | 136bc8b2 |  |
| a-line-bob.density_fit.high.note | take out weight at the nape | noņem biezumu pakausī | e9a83878 |  |
| a-line-bob.growth.note | A short nape shows whorls; check the growth pattern before shortening the back. | Īsa kakla daļa atsedz virpuļus; pirms saīsini aizmuguri, pārbaudi matu augšanas virzienu. | c614f202 |  |
| a-line-bob.strand_note | Smooth, fine hair is a good fit; coarse hair needs thinning at the nape. | Lieliski piemērots gludiem, smalkiem matiem; raupjiem matiem jānoņem biezums pakausī. | 9a242ea0 |  |
| a-line-bob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| a-line-bob.upkeep.products.1 | shine spray | spīduma sprejs | d0399526 |  |
| a-line-bob.grow_out | Easy to grow into a lob; the angle softens naturally. | Viegli ataudzēt par lob griezumu; asais leņķis dabiski izlīdzinās. | 33772694 |  |
| a-line-bob.client | A sleek bob that is slightly shorter at the back than the front. | Gluds bobs, kas aizmugurē ir nedaudz īsāks nekā priekšpusē. | 884591c1 |  |
| a-line-bob.stylist | Set the back shorter than the front by 3-6 cm; blend the nape to avoid a shelf and cut the perimeter on a soft diagonal. Weight: weight in a diagonal, shorter at the nape and longer at the front. | Nogriez aizmuguri par 3–6 cm īsāku nekā priekšpusi; sapludini kakla zonu, lai neveidotos pakāpiens, un griez perimetru maigā diagonālē. Smagums: diagonāla masa — īsāka pie kakla un garāka priekšpusē. | 52f9e254 |  |
| stacked-inverted-bob.name | Stacked inverted bob | Apgrieztais bobs ar pacēlumu | 9622e8ec |  |
| stacked-inverted-bob.texture_fit.curly.note | a steep stack turns into bulk on curls; see curly-wedge-bob | stāvs pacēlums cirtās kļūst pārāk masīvs; skatīt curly-wedge-bob | 0384fa78 |  |
| stacked-inverted-bob.texture_fit.coily.note | see asymmetric-coily-taper | skatīt asymmetric-coily-taper | bac4d328 |  |
| stacked-inverted-bob.density_fit.low.note | fine hair flattens at the nape | smalki mati pakausī pieplok | c459b2f6 |  |
| stacked-inverted-bob.density_fit.high.note | thin the stacks | samazini biezumu graduētajā zonā | 9b8b536c |  |
| stacked-inverted-bob.growth.note | Examine the occipital bone and nape whorl before building a steep stack. | Pirms veido stāvu graduāciju pakausī, novērtē pakauša kaulu un kakla virpuli. | cd38badc |  |
| stacked-inverted-bob.strand_note | Needs enough body to stack without collapsing. | Nepieciešams pietiekams matu biezums un stingrība, lai pacēlums nesakristos. | 1a195087 |  |
| stacked-inverted-bob.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| stacked-inverted-bob.upkeep.products.1 | strong-hold spray | stipras fiksācijas laka | 6e2865d8 |  |
| stacked-inverted-bob.grow_out | The strong angle softens in 6-8 weeks and becomes an A-line. | Izteiktais leņķis izlīdzinās 6–8 nedēļu laikā un pārtop par A-līnijas griezumu. | 214e97ca |  |
| stacked-inverted-bob.client | A bob with a steep angle, short and stacked at the back, longer at the front. | Bobs ar izteiktu leņķi — aizmugurē īss un ar pacēlumu, priekšpusē garāks. | 006b6866 |  |
| stacked-inverted-bob.stylist | Use higher graduation than the standard graduated bob, choose a steep diagonal forward line and cross-check each section. Weight: steep stack at the back with a steep diagonal to the front. | Veido augstāku graduāciju nekā klasiskajam graduētajam bobam, izvēlies stāvu diagonālu līniju uz priekšu un pārbaudi katru šķipsnu šķērsām. Smagums: stāva graduācija pakausī ar asu diagonāli uz priekšu. | 8ec67028 |  |
| soft-layered-bob.name | Soft layered bob | Viegli pakāpenisks bobs | f5315052 |  |
| soft-layered-bob.texture_fit.curly.note | cut dry and keep layers long | griez sausos matos un atstāj garas pakāpes | 0965c92d |  |
| soft-layered-bob.texture_fit.coily.note | tight curls shrink more, keep the shape rounded | stingras cirtas saraujas vairāk, tāpēc saglabā formu noapaļotu | 152076fa |  |
| soft-layered-bob.density_fit.low.note | fine hair loses density if layers are short | smalki mati zaudē biezumu, ja pakāpes ir īsas | f06ce5d0 |  |
| soft-layered-bob.growth.note | Look at the crown and front hairline before cutting top layers. | Pirms griez virsējās pakāpes, novērtē virsgalvu un priekšējo matu augšanas līniju. | 77604f83 |  |
| soft-layered-bob.strand_note | Layers add volume to fine hair when kept long and not thinned. | Pakāpes piešķir apjomu smalkiem matiem, ja tās atstāj garas un neizplānina. | af8c0808 |  |
| soft-layered-bob.upkeep.products.0 | light mousse | vieglas fiksācijas putas | afc8a642 |  |
| soft-layered-bob.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| soft-layered-bob.grow_out | Grows into a layered lob, and the layers keep the shape while it does. | Ataug par pakāpenisku lob griezumu, un pakāpes saglabā formu visā ataugšanas laikā. | 8a4cb2b1 |  |
| soft-layered-bob.client | A bob with soft layers that give movement. Easy to style with a round brush or by air-drying. | Bobs ar maigām pakāpēm, kas piešķir kustību. Viegli ieveidot ar apaļo suku vai ļaujot izžūt dabiski. | 348ff22e |  |
| soft-layered-bob.stylist | Cut the base first, then add low layers from the cheekbone with point cutting; keep the layers connected to avoid steps. Weight: weight softened by layers from the cheekbone down. | Vispirms nogriez pamatlīniju, pēc tam ar point cut tehniku izveido maigas pakāpes no vaigu kaulu līmeņa; saglabā pakāpes savienotas, lai neveidotos pakāpieni. Smagums: masa mīkstināta ar pakāpēm no vaigu kauliem uz leju. | 601ed4a7 |  |
| choppy-bob.name | Choppy bob | Choppy bobs | 032cc393 |  |
| choppy-bob.texture_fit.curly.note | point-cut instead of razoring for curls | cirtām izmanto point-cut tehniku, nevis skuvekli | b9efdc68 |  |
| choppy-bob.texture_fit.coily.note | use curly-bob-rounded | izvēlies curly-bob-rounded | 7c8df1a8 |  |
| choppy-bob.density_fit.low.note | razoring on fine hair leaves ends see-through | griežot smalkus matus ar skuvekli, gali kļūst caurspīdīgi | fcd9fb36 |  |
| choppy-bob.growth.note | Cut the crown carefully, because choppy ends draw attention to a cowlick. | Virsgalvu griez uzmanīgi, jo robaini gali pievērš uzmanību virpulim. | b8358684 |  |
| choppy-bob.strand_note | Thick hair benefits most; fine hair needs a soft hand. | Vispiemērotākais bieziem matiem; smalkiem matiem vajadzīga viegla roka. | 0f4f06d0 |  |
| choppy-bob.upkeep.products.0 | texturising paste | teksturējoša pasta | 5811656a |  |
| choppy-bob.upkeep.products.1 | dry texture spray | sausais tekstūras sprejs | b186c653 |  |
| choppy-bob.grow_out | Choppy ends fade within 6 weeks and are easy to refresh. | Robainie gali zaudē asumu 6 nedēļu laikā, un tos ir viegli atjaunot. | 7ab01592 |  |
| choppy-bob.client | A bob with broken, messy ends that looks relaxed and easy. | Bobs ar nevienmērīgiem, teksturētiem galiem nepiespiestam un brīvam tēlam. | 53182e22 |  |
| choppy-bob.stylist | Point cut and slice through the ends to remove weight, leaving the base line visible so the shape remains. Weight: weight broken up, ends staggered. | Veic point cut un slīdošo griezumu matu galos, lai noņemtu smagumu, atstājot redzamu bāzes līniju formas saglabāšanai. Smagums: masa izkliedēta, gali pakāpēs un dažāda garuma. | 75571854 |  |
| asymmetric-bob.name | Asymmetric bob | Asimetrisks bobs | 65484df4 |  |
| asymmetric-bob.texture_fit.curly.note | cut dry to see the real curl pattern | griez sausos matos, lai redzētu īsto cirtu zīmējumu | 0d5693a0 |  |
| asymmetric-bob.texture_fit.coily.note | see curly-asymmetric-bob | skatīt curly-asymmetric-bob | 87352ca9 |  |
| asymmetric-bob.density_fit.low.note | avoid on very fine hair, the long side falls limp | nav ieteicams ļoti smalkiem matiem — garākā puse izskatīsies sašļukusi | 2dce1889 |  |
| asymmetric-bob.growth.note | Match the longer side to the natural part. | Pielāgo garāko pusi dabiskajam celiņam. | c493b57d |  |
| asymmetric-bob.strand_note | The longer side needs enough strand strength to hold an edge. | Garākajai pusei vajadzīgi pietiekami spēcīgi mati, lai noturētu līniju. | c7b87aac |  |
| asymmetric-bob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| asymmetric-bob.upkeep.products.1 | texture spray | tekstūras sprejs | 9bf0ec6a |  |
| asymmetric-bob.grow_out | Even out the sides to return to a regular bob. | Nolīdzini sānus, lai atgrieztos pie klasiskā boba. | a9b56077 |  |
| asymmetric-bob.client | A bob with one side longer than the other for a modern edge. | Bobs ar vienu garāku pusi mūsdienīgam un pamanāmam akcentam. | 154af856 |  |
| asymmetric-bob.stylist | Set the part first, then angle the perimeter from jaw length on the short side to chin on the long side, blending at the back. Weight: one side longer than the other; weight shifts off-centre. | Vispirms iezīmē celiņu, pēc tam veido perimetra leņķi no žokļa līnijas īsākajā pusē līdz zodam garākajā pusē, aizmugurē pāreju sapludinot. Smagums: viena puse garāka par otru; smaguma punkts nobīdīts no centra. | 22165c19 |  |
| shaggy-bob.name | Shaggy bob | Shaggy bobs | c9067177 |  |
| shaggy-bob.texture_fit.curly.note | good on 2B-3B curls; shape with a diffuser | lieliski piemērots 2B–3B cirtām; ieveido ar difuzoru | ac36a8d6 |  |
| shaggy-bob.texture_fit.coily.note | keep layers longer than for waves | pakāpes atstāj garākas nekā viļņainiem matiem | c4df42e0 |  |
| shaggy-bob.density_fit.high.note | thin the crown layers if heavy | ja mati virspusē ir smagi, izplānini pakāpes | 612cbbd1 |  |
| shaggy-bob.growth.note | Crown layers show whorls, so keep them long there. | Pakāpes virsgalvā izceļ virpuļus, tāpēc šajā zonā atstāj tās garākas. | cc937ae1 |  |
| shaggy-bob.strand_note | Fine hair gains volume from the layers; thick hair needs interior layering. | Smalki mati ar pakāpēm iegūst apjomu; bieziem matiem jāveido iekšējās pakāpes. | bd78bb9d |  |
| shaggy-bob.upkeep.products.0 | texturising spray | teksturējošs sprejs | 1544201e |  |
| shaggy-bob.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| shaggy-bob.grow_out | Grows into a shaggy lob and then a shag; the crown layers stay useful throughout. | Pāraug par shaggy lob un pēc tam par shag; virsgalvas pakāpes saglabā savu lomu visu ataugšanas laiku. | eb8f6fe4 |  |
| shaggy-bob.client | A bob with shaggy layers that looks easy and tousled. | Bobs ar rotaļīgām pakāpēm nepiespiestam un viegli izspūrušam tēlam. | 80ce397d |  |
| shaggy-bob.stylist | Cut the perimeter, add short layers around the crown and long layers through the body, and leave a curtain fringe to link the face. Weight: weight at the cheeks and crown, ends fine and layered. | Nogriez perimetru, izveido īsākas pakāpes virsgalvā un garākas pakāpes matu pamatmasā, un atstāj aizkarveida priekšmatus, lai savienotu griezumu ar seju. Smagums: apjoms vaigu un virsgalvas zonā, gali smalki un pakāpeniski. | 71558fd1 |  |
| bevelled-bob.name | Bevelled bob | Bevelled bobs | 0c4f5179 |  |
| bevelled-bob.texture_fit.curly.note | cut dry on loose curls and bevel by hand | vieglām cirtām griez sausos matos un galus ieloki ar rokām | ba1d2336 |  |
| bevelled-bob.texture_fit.coily.note | use curly-bob-rounded | izvēlies curly-bob-rounded | 7c8df1a8 |  |
| bevelled-bob.density_fit.high.note | internal thinning | iekšējā filēšana | 75e5a864 |  |
| bevelled-bob.growth.note | Check the front hairline since the front curves in. | Pārbaudi priekšējo matu augšanas līniju, jo priekšpuse liecas uz iekšu. | 4aa2f6cf |  |
| bevelled-bob.strand_note | Medium strands hold tucked ends best. | Vidēji biezi mati vislabāk notur uz iekšu ielocītos galus. | 4c53f9c7 |  |
| bevelled-bob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| bevelled-bob.grow_out | Becomes a soft lob within about three months, with no change in structure. | Aptuveni trīs mēnešu laikā pārtop par maigu lob griezumu, nemainot griezuma struktūru. | 9507dae8 |  |
| bevelled-bob.client | A smooth bob with ends that tuck under in a neat curve. | Gluds bobs ar glīti uz iekšu ielocītiem galiem. | e8cb733e |  |
| bevelled-bob.stylist | Use a slightly rounded perimeter and a blow-dry that turns the ends under; bevel the corners with small point cuts. Weight: edge softly rounded under at the ends. | Veido nedaudz noapaļotu perimetru un ieveido ar fēnu, galus liecot uz iekšu; stūrus noapaļo ar smalku point cut tehniku. Smagums: matu gali maigi ielocīti uz iekšu. | 0672e85c |  |
| mushroom-bob.name | Mushroom bob | Mushroom bobs | 4d017255 |  |
| mushroom-bob.texture_fit.curly.note | cut dry and keep the top fuller | griez sausos matos un saglabā kuplāku augšdaļu | f311bdbe |  |
| mushroom-bob.texture_fit.coily.note | use curly-bowl-crop | izvēlies curly-bowl-crop | 0f9fe32a |  |
| mushroom-bob.density_fit.low.note | fine hair may lose shape | smalki mati var nenoturēt formu | 1631da84 |  |
| mushroom-bob.growth.note | A crown whorl needs a longer section or it will push the rounded top out of shape. | Ja virsgalvā ir virpulis, tur jāatstāj garāka šķipsna, citādi tas izjauks noapaļoto augšdaļas formu. | a35872df |  |
| mushroom-bob.strand_note | The curved outline suits medium strands. | Noapaļotā kontūra vislabāk piemērota vidēji bieziem matiem. | bc8520fd |  |
| mushroom-bob.upkeep.products.0 | blow-dry cream | fēnošanas krēms | 8640b75b |  |
| mushroom-bob.grow_out | The round shape remains for about two months. | Noapaļotā forma saglabājas apmēram divus mēnešus. | da0de58d |  |
| mushroom-bob.client | A bob with a rounded top that curves in at the ends like a mushroom. | Bobs ar noapaļotu augšdaļu un uz iekšu ielocītiem galiem sēnes formā. | cccc74b0 |  |
| mushroom-bob.stylist | Create a convex shape at the crown with graduated layers, tuck the ends and keep the fringe just long enough to blend. Weight: weight at the crown that curves in toward the ears. | Izveido izliektu formu virsgalvā ar graduētām pakāpēm, ieloki galus uz iekšu un atstāj priekšmatus tieši tik garus, lai tie saplūstu ar griezumu. Smagums: masa virsgalvā, kas ausu virzienā liecas uz iekšu. | 39d88844 |  |
| pageboy-bob.name | Pageboy | Pāža griezums | 35e53a7c |  |
| pageboy-bob.texture_fit.wavy.note | set the ends with a round brush | galus ieveido ar apaļo suku | 08e65ad3 |  |
| pageboy-bob.texture_fit.curly.note | curls will not hold a turned-under line; see curly-bob-with-fringe | cirtas nenoturēs uz iekšu ielocīto līniju; skaties curly-bob-with-fringe | 2d150b5d |  |
| pageboy-bob.texture_fit.coily.note | see curly-bob-with-fringe or coily-sculpted-chin-bob | skaties curly-bob-with-fringe vai coily-sculpted-chin-bob | 888e845c |  |
| pageboy-bob.density_fit.low.note | fine hair loses lift | smalki mati zaudē pacēlumu pie saknēm | ffd32d58 |  |
| pageboy-bob.density_fit.high.note | internal thinning | iekšējā filēšana | 75e5a864 |  |
| pageboy-bob.growth.note | Cut the crown carefully since it is on display. | Virsgalvu griez īpaši uzmanīgi, jo tā ir labi redzama. | d0d2d011 |  |
| pageboy-bob.strand_note | Best on smooth, fine to medium strands that lie flat and curve under without help. | Vislabāk piemērots gludiem, smalkiem līdz vidēji bieziem matiem, kas pieguļ galvai un paši dabiski liecas uz iekšu. | 1746ff94 |  |
| pageboy-bob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| pageboy-bob.grow_out | Grows into a long bob; the fringe is the part that needs regular trimming every 3-4 weeks. | Pāraug garajā bobā; priekšmati ir vienīgā daļa, kas regulāri jāpielīdzina ik pēc 3–4 nedēļām. | 72e0b956 |  |
| pageboy-bob.client | A smooth, rounded bob with a straight-across fringe. | Gluds, noapaļots bobs ar taisniem priekšmatiem. | 61eacab8 |  |
| pageboy-bob.stylist | Cut the perimeter with a gentle curve and a heavy fringe, with the ends turned under. Weight: heavy, even, rounded weight turned under. | Veido perimetru ar maigu izliekumu un biezus priekšmatus, galus ieveidojot uz iekšu. Smagums: blīva, vienmērīga un noapaļota masa, kas vērsta uz iekšu. | 505a43c3 |  |
| nape-undercut-bob.name | Nape undercut bob | Bobs ar izskūtu pakausi | bc9dd1b8 |  |
| nape-undercut-bob.texture_fit.curly.note | cut the undercut with care on curls | cirtainiem matiem izskūto pakausi griez uzmanīgi | cfe63168 |  |
| nape-undercut-bob.texture_fit.coily.note | the undercut must be tight for tight curls | sīkām cirtām izskūtajai daļai jābūt ļoti īsai | 86783db4 |  |
| nape-undercut-bob.density_fit.low.note | fine hair loses density at the nape | smalki mati pakausī zaudē biezumu | e06e0085 |  |
| nape-undercut-bob.growth.note | Check nape growth patterns carefully; a strong whorl can push the shaved area out of line. | Rūpīgi pārbaudi matu augšanas virzienu kakla zonā; izteikts virpulis var izjaukt noskūtās zonas līniju. | aa00c323 |  |
| nape-undercut-bob.strand_note | Thick strands benefit from bulk removal. | Bieziem matiem lieliski noder liekā apjoma noņemšana. | 37370da6 |  |
| nape-undercut-bob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| nape-undercut-bob.grow_out | The undercut fills in within about 4 weeks, so no grow-out stage is visible beneath the length. | Undercut ataug aptuveni 4 nedēļu laikā, tāpēc zem matu garuma ataugšanas posms nav pamanāms. | 5faac8f6 |  |
| nape-undercut-bob.client | A bob with a tidy, shaved section under the nape that removes bulk. | Bobs ar glīti izskūtu pakausi, kas noņem lieko smagumu. | 588ef689 |  |
| nape-undercut-bob.stylist | Clipper cut the nape under a held-up section, leave the top section long to cover the line. Weight: removable bulk at the nape under the length. | Noskuj ar mašīnīti kakla zonu zem paceltās matu sekcijas, virsējo sekciju atstāj garu, lai nosegtu līniju. Smagums: noņemts apjoms kakla zonā zem virsējā matu garuma. | 03d389a3 |  |
| curtain-fringe-bob.name | Curtain-fringe bob | Bobs ar aizkarveida priekšmatiem | ec591fa3 |  |
| curtain-fringe-bob.texture_fit.curly.note | cut the fringe dry and allow for shrinkage | priekšmatus griez sausos matos, rēķinoties ar saraušanos | f9764550 |  |
| curtain-fringe-bob.texture_fit.coily.note | use curly-bob-with-fringe | izvēlies curly-bob-with-fringe | 49140390 |  |
| curtain-fringe-bob.density_fit.high.note | thin the fringe lightly | viegli izfilē priekšmatus | 3797280c |  |
| curtain-fringe-bob.growth.note | Check crown cowlicks; a centre part needs a calm front hairline. | Pārbaudi virpuļus virsgalvā; celiņam vidū ir nepieciešama mierīga priekšējā matu augšanas līnija. | 9cee0030 |  |
| curtain-fringe-bob.strand_note | A soft fringe suits medium and fine strands; coarse hair needs more blending into the sides. | Maigi priekšmati piestāv vidēji bieziem un smalkiem matiem; raupji mati vairāk jāsapludina ar sāniem. | 17f7931d |  |
| curtain-fringe-bob.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| curtain-fringe-bob.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| curtain-fringe-bob.grow_out | The fringe grows out as face-framing layers without an awkward stage. | Priekšmati ataug kā seju ierāmējošas pakāpes bez neērta pārejas posma. | d7bd556e |  |
| curtain-fringe-bob.client | A chin bob with a fringe that parts in the middle and sweeps to the sides. | Bobs līdz zodam ar priekšmatiem, kas dalās vidū un maigi krīt uz sāniem. | b0c7912f |  |
| curtain-fringe-bob.stylist | Cut the fringe from a triangular section at the part, taper to the cheekbone, then link it into the side lengths. Weight: weight at the jaw, with a soft centre-parted fringe curving away from the face. | Griez priekšmatus no trīsstūrveida sekcijas pie celiņa, sašaurini virzienā uz vaigu kauliem, pēc tam sapludini ar sānu garumu. Smagums: masa žokļa līnijā ar maigiem, pa vidu šķirtiem priekšmatiem, kas lokās prom no sejas. | bd297bef |  |
| full-fringe-bob.name | Full-fringe bob | Bobs ar bieziem priekšmatiem | 48b3e4cc |  |
| full-fringe-bob.texture_fit.wavy.note | the fringe may curl up, so blow-dry it flat | priekšmati var celties uz augšu, tāpēc izžāvē tos taisnus ar fēnu | d52c26fd |  |
| full-fringe-bob.texture_fit.curly.note | a blunt fringe springs up on curls; see curly-bob-with-fringe | taisni priekšmati cirtās strauji saraujas uz augšu; skaties curly-bob-with-fringe | 5448bd99 |  |
| full-fringe-bob.texture_fit.coily.note | a blunt fringe shrinks to the hairline on coils; see curly-bob-with-fringe | taisni priekšmati sīkās cirtās saraujas līdz matu augšanas līnijai; skaties curly-bob-with-fringe | 7177fff7 |  |
| full-fringe-bob.density_fit.low.note | fine hair looks sparse in the fringe | smalkiem matiem priekšmati var izskatīties reti | 75f42c56 |  |
| full-fringe-bob.growth.note | Needs good front density and a calm hairline; check cowlicks. | Nepieciešams labs matu blīvums priekšpusē un mierīga matu augšanas līnija; pārbaudi virpuļus. | ada4a0a6 |  |
| full-fringe-bob.strand_note | Medium-weight straight strands work best; coarse hair can push the fringe forward. | Vislabāk piemēroti vidēji biezi, taisni mati; raupji mati var spiest priekšmatus uz priekšu. | ec5e05aa |  |
| full-fringe-bob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| full-fringe-bob.upkeep.products.1 | dry shampoo | sausais šampūns | 0aaae6ea |  |
| full-fringe-bob.grow_out | The fringe can be grown into a curtain fringe, passing through an awkward length at about 6 weeks. | Priekšmatus var ataudzēt par aizkarveida priekšmatiem, apmēram pēc 6 nedēļām izejot cauri neērtam garuma posmam. | 30cdd5de |  |
| full-fringe-bob.client | A bob with a thick fringe that sits straight above the brows. | Bobs ar bieziem priekšmatiem, kas sniedzas taisni virs uzacīm. | abdcc5f6 |  |
| full-fringe-bob.stylist | Section a wide triangular fringe, cut straight, then point cut to soften the edge. Weight: heavy bob and a heavy straight-across fringe. | Izdali platu trīsstūrveida priekšmatu sekciju, nogriez taisni, pēc tam izmanto point cut tehniku, lai mīkstinātu maliņu. Smagums: masīvs bobs ar bieziem, taisniem priekšmatiem. | ebe392b5 |  |
| wavy-beach-bob.name | Wavy beach bob | Viļņains pludmales bobs | 175bc241 |  |
| wavy-beach-bob.texture_fit.curly.note | cut on dry hair | griez sausos matos | 17b59828 |  |
| wavy-beach-bob.texture_fit.coily.note | tight curls need extra length | sīkām cirtām vajag papildu garumu | d595b86d |  |
| wavy-beach-bob.growth.note | Waves react to the weather, so cut dry or damp in the pattern and watch cowlicks at the crown and nape that may change the wave direction. | Viļņi reaģē uz laikapstākļiem, tāpēc griez sausos vai mitros matos atbilstoši to dabiskajam kritumam un pievērs uzmanību virpuļiem virsgalvā un kakla zonā, kas var mainīt viļņu virzienu. | 1792dd68 |  |
| wavy-beach-bob.strand_note | The wave pattern shows best in medium to fine strands. | Viļņu tekstūra vislabāk izceļas vidēji biezos līdz smalkos matos. | 2d138390 |  |
| wavy-beach-bob.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| wavy-beach-bob.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| wavy-beach-bob.grow_out | Grows into a wavy lob, and the loose texture covers the length change. | Ataug par viļņainu lobu, un brīvā tekstūra dabiski piesedz garuma maiņu. | c8a826cc |  |
| wavy-beach-bob.client | A relaxed chin-length bob with a bit of wave and broken ends. It dries into an easy, lived-in shape with sea-salt spray or just air-drying. | Brīvs bobs līdz zodam ar vieglu vilni un teksturētiem galiem. Ieveidojas nepiespiestā, dabiskā formā ar jūras sāls aerosolu vai vienkārši ļaujot matiem izžūt pašiem. | 50cdac4e |  |
| wavy-beach-bob.stylist | Cut dry or damp in the wave pattern, adding long layers for movement. Weight: light weight at the jaw, ends broken. | Griez sausos vai mitros matos atbilstoši viļņu zīmējumam, pievienojot garas pakāpes kustībai. Smagums: viegls apjoms pie žokļa līnijas, gali izretināti un teksturēti. | b116c2d2 |  |
| fine-hair-weighted-bob.name | Weighted bob for fine hair | Blīvs bobs smalkiem matiem | 2aa0bab5 |  |
| fine-hair-weighted-bob.texture_fit.curly.note | fine curls need a fuller shape | smalkām cirtām vajag pilnīgāku formu | a7a18ff6 |  |
| fine-hair-weighted-bob.texture_fit.coily.note | see curly-bob-rounded | skaties curly-bob-rounded | 5da6dfee |  |
| fine-hair-weighted-bob.density_fit.high.note | use internal debulking | noņem iekšējo apjomu | 643846a7 |  |
| fine-hair-weighted-bob.growth.note | Check the part and hairline before choosing the length. | Pirms garuma izvēles pārbaudi celiņu un matu augšanas līniju. | dbaac879 |  |
| fine-hair-weighted-bob.strand_note | Designed for fine strands where a blunt edge creates a thicker look. | Paredzēts smalkiem matiem, kur taisna griezuma līnija rada biezāku matu iespaidu. | b2a7db53 |  |
| fine-hair-weighted-bob.upkeep.products.0 | volumising mousse | apjoma putas | 07b4f2db |  |
| fine-hair-weighted-bob.upkeep.products.1 | root-lift spray | sakņu pacelšanas sprejs | 97d186da |  |
| fine-hair-weighted-bob.grow_out | Grows into a collarbone lob; trim the perimeter every 6-8 weeks to keep the ends dense. | Ataug par lobu līdz atslēgas kaulam; ik pēc 6–8 nedēļām pielīdzini perimetru, lai gali saglabātu biezumu. | 7ede1ef9 |  |
| fine-hair-weighted-bob.client | A blunt chin-length bob that makes fine hair look dense and shiny, with only hidden layers for movement. | Taisns bobs līdz zodam, kas liek smalkiem matiem izskatīties blīviem un spīdīgiem, ar slēptām kārtām tikai kustībai. | 0f33c6fc |  |
| fine-hair-weighted-bob.stylist | Keep the perimeter blunt and cut 2-3 long, hidden layers inside the back to prevent a flat shape. Avoid thinning shears or razors, which weaken fine ends. Weight: blunt base with only light, hidden layers. | Saglabā taisnu perimetru un aizmugures iekšpusē izveido 2–3 garas, paslēptas pakāpes, lai novērstu plakanu formu. Izvairies no filēšanas šķērēm vai naža, kas novājina smalkos matu galus. Smagums: taisna bāzes līnija tikai ar vieglām, paslēptām pakāpēm. | 41bb1c4b |  |
| side-swept-fringe-bob.name | Side-swept fringe bob | Bobs ar slīpiem priekšmatiem | 10c88e15 |  |
| side-swept-fringe-bob.texture_fit.curly.note | allow for spring in the fringe | rēķinies ar priekšmatu saraušanos | 1a4297ec |  |
| side-swept-fringe-bob.texture_fit.coily.note | use curly-bob-with-fringe | izvēlies curly-bob-with-fringe | 49140390 |  |
| side-swept-fringe-bob.density_fit.high.note | thin the fringe lightly | viegli izfilē priekšmatus | 3797280c |  |
| side-swept-fringe-bob.growth.note | The fringe direction should follow the natural part. | Priekšmatu virzienam jāseko dabiskajam celiņam. | 9d77886d |  |
| side-swept-fringe-bob.strand_note | Straight to wavy medium strands sweep best; very fine hair needs a little root lift. | Vislabāk uz sānu gulstas taisni līdz viļņaini vidēja biezuma mati; ļoti smalkiem matiem vajadzēs nedaudz pacelt saknes. | 5cf24337 |  |
| side-swept-fringe-bob.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| side-swept-fringe-bob.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| side-swept-fringe-bob.grow_out | The fringe merges with the sides in about 8 weeks, so the shape stays tidy while it grows. | Priekšmati saplūst ar sāniem aptuveni 8 nedēļu laikā, tāpēc forma ataugot saglabājas sakopta. | 4e9c1a72 |  |
| side-swept-fringe-bob.client | A chin-length bob with a long fringe that sweeps across to one side. Easy to style and soft around the face. | Bobs līdz zodam ar gariem, uz vienu sānu vērstiem priekšmatiem. Viegli ieveidojams un maigi ierāmē seju. | f069014b |  |
| side-swept-fringe-bob.stylist | Mark the parting, cut the fringe on a long diagonal from the part to the cheekbone and blend it into the side length. Cut the fringe dry to confirm it falls naturally. Weight: weight at the jaw, with a long diagonal fringe. | Iezīmē celiņu, griez priekšmatus pa garu diagonāli no celiņa līdz vaigu kaulam un sapludini ar sānu garumu. Griez priekšmatus sausos matos, lai pārliecinātos par to dabisko kritumu. Smagums: smagums žokļa līnijā ar gariem diagonāliem priekšmatiem. | ef6e80e2 |  |
| tiered-bi-level-bob.name | Tiered bi-level bob | Divu līmeņu bobs | 0d55c65b |  |
| tiered-bi-level-bob.texture_fit.curly.note | the upper tier sits as a natural cap on loose curls | augšējais līmenis brīvām lokām veido dabisku cepurīti | 4ed4bf66 |  |
| tiered-bi-level-bob.texture_fit.coily.note | on tight curls keep the upper tier 3 cm longer to allow for spring | sīkām cirtām augšējo līmeni atstāj par 3 cm garāku, rēķinoties ar saraušanos | a3edd9ef |  |
| tiered-bi-level-bob.density_fit.low.note | fine hair can look thin in the lower tier, keep the base blunt | smalki mati apakšējā līmenī var izskatīties pārāk plāni, tāpēc pamatlīniju atstāj taisnu | b86dd916 |  |
| tiered-bi-level-bob.density_fit.high.note | removes bulk without losing length | noņem lieko biezumu, nezaudējot garumu | 0922f1c5 |  |
| tiered-bi-level-bob.growth.note | Look at the crown whorl, because the upper tier must lie on it cleanly. | Pievērs uzmanību virpulim virsgalvā, jo augšējam līmenim pār to ir precīzi un glīti jāieguļas. | 49ea278a |  |
| tiered-bi-level-bob.strand_note | Medium to thick strands hold the two tiers; fine strands blur the break. | Vidēji un biezi mati labi notur abus līmeņus; smalkos matos pārejas līnija izplūst. | 3c57c120 |  |
| tiered-bi-level-bob.upkeep.products.0 | texture spray | tekstūras sprejs | 9bf0ec6a |  |
| tiered-bi-level-bob.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| tiered-bi-level-bob.grow_out | Grows into a shag bob; the tiers merge in about 10 weeks. | Ataug par shag bobu; līmeņi saplūst aptuveni 10 nedēļu laikā. | fd9ab9cd |  |
| tiered-bi-level-bob.client | A bob with two levels that gives extra body on top. The short layer lifts and the longer layer keeps the weight. | Bobs divos līmeņos, kas piešķir papildu apjomu augšpusē. Īsākā kārta paceļ matus, bet garākā saglabā blīvumu. | af7a3d37 |  |
| tiered-bi-level-bob.stylist | Take a horizontal parting at the temple-to-crown line, disconnect the upper section 3-5 cm shorter than the base and soften the join with point cutting. Weight: a shorter upper tier floats over a longer base tier, creating two weight points. | Veic horizontālu šķirtni no deniņiem līdz virsgalvai, atdali augšējo sekciju (disconnect) par 3–5 cm īsāku par bāzi un mīkstini savienojumu ar point cut. Smagums: īsāks augšējais līmenis viegli klājas pāri garākajam bāzes līmenim, veidojot divus smaguma punktus. | a9c54b8e |  |
| soft-bowl-cut.name | Soft bowl cut | Maigs bļodiņas griezums | 27e699d6 |  |
| soft-bowl-cut.texture_fit.curly.note | cut dry to keep the curls even | griez sausos matos, lai cirtas saglabātos vienmērīgas | 2e015799 |  |
| soft-bowl-cut.texture_fit.coily.note | keep length on top for shrinkage, see Curly bowl crop | atstāj garumu augšpusē saraušanās dēļ; skaties Curly bowl crop | 640895ba |  |
| soft-bowl-cut.growth.note | Crown whorl may push the top; leave extra length there. | Virpulis virsgalvā var pacelt augšējo daļu; atstāj tur papildu garumu. | 005d026b |  |
| soft-bowl-cut.strand_note | Medium to coarse straight strands keep the round line; fine hair needs more body at the crown. | Vidēji līdz raupji taisni mati labi notur apaļo līniju; smalkiem matiem vajag vairāk apjoma galvas virspusē. | 4c0471f7 |  |
| soft-bowl-cut.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| soft-bowl-cut.upkeep.products.1 | matte paste | matēta pasta | 91424e12 |  |
| soft-bowl-cut.grow_out | Grows into a mushroom bob and then a chin bob, so the round shape remains for about 8 weeks. | Ataug par mushroom bobu un pēc tam par bobu līdz zodam, tāpēc noapaļotā forma saglabājas apmēram 8 nedēļas. | ad59fe52 |  |
| soft-bowl-cut.client | A soft, rounded bowl with a short fringe. Playful, graphic and easy to wash and go. | Maigs, noapaļots bļodiņas griezums ar īsiem priekšmatiem. Rotaļīgs, grafisks un pavisam vienkāršs ikdienā — izmazgā un dodies. | 971a581e |  |
| soft-bowl-cut.stylist | Cut a uniform round shape with soft edges, keep the nape slightly tapered and point cut the fringe for softness. Weight: round, even weight sitting around the head at the ears. | Veido vienmērīgi noapaļotu formu ar mīkstām malām, kakla zonu saglabā nedaudz sašaurinātu un iestrādā priekšmatos point cut maigākam kritumam. Smagums: apaļš, vienmērīgs smaguma sadalījums ap galvu ausu līmenī. | 98f4a4f2 |  |
| retro-set-bob.name | Set-friendly retro bob | Retro bobs ieveidošanai | ee3876c9 |  |
| retro-set-bob.texture_fit.curly.note | set curls or finger waves into smooth shapes | ieveido lokas vai pirkstu viļņus gludās formās | 45acec46 |  |
| retro-set-bob.texture_fit.coily.note | set shapes do not hold on coils; see coily-sculpted-chin-bob | ieveidotās formas neturas sīkās cirtās; skaties coily-sculpted-chin-bob | ec79a2c2 |  |
| retro-set-bob.density_fit.high.note | use internal thinning | veic iekšējo filēšanu | ab1fd2af |  |
| retro-set-bob.growth.note | Check the front hairline since waves move around it. | Pārbaudi priekšējo matu augšanas līniju, jo viļņi veidojas ap to. | dbcd853d |  |
| retro-set-bob.strand_note | Even strands of medium density set best. Fine hair loses the curl quickly and very coarse hair springs out. | Vislabāk ieveidot vienmērīgus, vidēji biezus matus. Smalki mati ātri zaudē loku, bet ļoti raupji mati atlec vaļā. | 4a0f32b8 |  |
| retro-set-bob.upkeep.products.0 | setting lotion | veidošanas losjons | 2bc9c283 |  |
| retro-set-bob.upkeep.products.1 | light pomade | vieglas fiksācijas pomāde | ccc6c968 |  |
| retro-set-bob.grow_out | Grows out softly into a long bob, and the set is replaced by a blow-dry once the shape relaxes. | Mīksti ataug par garo bobu, un, tiklīdz forma kļūst brīvāka, ieveidošanu ar ruļļiem var aizstāt ar parastu fēnošanu. | 6514a6e0 |  |
| retro-set-bob.client | A smooth vintage bob designed to be set into pin curls or finger waves for a polished look. | Gluds retro stila bobs, kas paredzēts ieveidošanai ruļļu lokās vai pirkstu viļņos izsmalcinātam tēlam. | c185a46d |  |
| retro-set-bob.stylist | Use a soft, even graduation with a smooth surface; leave enough length at the front for pin curls. Weight: soft graduation with smooth, even surface for setting. | Izmanto maigu, vienmērīgu graduāciju ar gludu virsmu; priekšpusē atstāj pietiekamu garumu pin curls veidošanai. Smagums: maiga graduācija ar gludu, vienmērīgu virsmu ieveidošanai. | e70f2524 |  |
| curly-bob-rounded.name | Rounded curly bob | Noapaļots cirtains bobs | 1c13330b |  |
| curly-bob-rounded.texture_fit.straight.note | blunt lines turn triangular; choose blunt-chin-bob | taisnas līnijas kļūst trīsstūrveida; izvēlies blunt-chin-bob | 2cf194c4 |  |
| curly-bob-rounded.texture_fit.wavy.note | loose waves look best with extra interior layers | viegli viļņi vislabāk izskatās ar papildu iekšējām kārtām | 795bd2ac |  |
| curly-bob-rounded.density_fit.low.note | fine curls look flat at the crown, so keep layers shallow | smalkas cirtas virspusē izskatās saplakušas, tāpēc kārtas veido seklas | b9c8a1e3 |  |
| curly-bob-rounded.density_fit.high.note | thick curls need interior thinning | biezām cirtām no iekšpuses jānoņem liekais biezums | fbe0322b |  |
| curly-bob-rounded.growth.note | Check the crown for a whorl; curls spiral around it. | Pārbaudi, vai virsgalvā nav virpuļa, jo lokas ap to vijas spirālē. | 175960e2 |  |
| curly-bob-rounded.strand_note | Works across strand sizes; fine curls keep their fullness with minimal layers. | Piemērots jebkura biezuma matiem; smalkas cirtas saglabā apjomu, ja kārtu ir minimāli. | 23da850b |  |
| curly-bob-rounded.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-bob-rounded.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| curly-bob-rounded.grow_out | Grows into a curly lob; the shape stays round. | Ataug par cirtainu lobu; forma saglabājas noapaļota. | d9c87042 |  |
| curly-bob-rounded.client | A bouncy curly bob with a rounded shape. | Atsperīgs cirtains bobs ar noapaļotu formu. | b6ebb405 |  |
| curly-bob-rounded.stylist | Cut dry curl by curl, starting with the length at the sides and back, then round the outline and refine the top layers. Weight: curls are shaped to a rounded outline with the weight just below the jaw. | Griez sausos matos loku pa lokai, sākot ar garumu sānos un aizmugurē, pēc tam noapaļo kontūru un noslīpē virsējās pakāpes. Smagums: lokas ir veidotas noapaļotā siluetā ar smaguma līniju tieši zem žokļa. | ec679399 |  |
| curly-a-line-bob.name | Curly A-line bob | Cirtains A līnijas bobs | 405ebde5 |  |
| curly-a-line-bob.texture_fit.straight.note | use a-line-bob | izvēlies a-line-bob | 3c2ab509 |  |
| curly-a-line-bob.texture_fit.coily.note | use light graduation and keep the nape well moisturised | veido vieglu graduāciju un labi mitrini matus pakausī | cc2c1bd7 |  |
| curly-a-line-bob.density_fit.low.note | fine curls look sparse at the nape, so keep the back fuller | smalkas cirtas pakausī izskatās retas, tāpēc aizmuguri atstāj pilnīgāku | 8a9eff70 |  |
| curly-a-line-bob.growth.note | A nape whorl can push the shorter back outward, so check how the nape curls grow. | Virpulis kakla zonā var izspiest īsāko aizmuguri uz āru, tāpēc pārbaudi, kā aug lokas pie kakla līnijas. | 9ef53516 |  |
| curly-a-line-bob.strand_note | Medium to thick curls hold the diagonal; fine curls need the back kept fuller. | Vidēji un biezi cirtaini mati labi notur diagonāli; smalkām cirtām aizmugure jāatstāj pilnīgāka. | 41de2a0f |  |
| curly-a-line-bob.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-a-line-bob.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| curly-a-line-bob.grow_out | The back grows to meet the front and the cut becomes a curly lob. | Aizmugure ataug līdz priekšpuses garumam, un griezums kļūst par cirtainu lobu. | 32bc49da |  |
| curly-a-line-bob.client | A curly bob that is longer at the front than at the back, with a rounded shape and no triangle. | Cirtains bobs, kas priekšpusē ir garāks nekā aizmugurē, ar noapaļotu formu un bez trīsstūra efekta. | 98478a3f |  |
| curly-a-line-bob.stylist | Cut the back shorter and graduate toward the front while shaping the curls dry, to avoid the pyramid shape. Weight: curls are shaped so the front falls longer than the back, without a triangle. | Griez aizmuguri īsāku un veido graduāciju uz priekšu, griežot sausas lokas, lai izvairītos no piramīdas formas. Smagums: lokas veidotas tā, lai priekšpuse kristu garāka par aizmuguri, neveidojot trīsstūri. | 511ba473 |  |
| curly-wedge-bob.name | Curly wedge bob | Cirtains ķīļveida bobs | d72a722a |  |
| curly-wedge-bob.texture_fit.wavy.note | waves need to be cut with minimal stacking | viļņainus matus griez ar minimālu gradāciju | 2efab08e |  |
| curly-wedge-bob.density_fit.low.note | fine curls collapse with too much stacking | smalkas lokas saplok, ja gradācija ir par lielu | 310b4dd1 |  |
| curly-wedge-bob.growth.note | The stack sits on the occipital bone; check the nape whorl. | Apjoma pacēlums balstās uz pakauša kaula; pārbaudi virpuli kakla zonā. | a3079b2a |  |
| curly-wedge-bob.strand_note | Dense curls build the stack, so the cut is best with medium to thick curls. | Biezas lokas labi veido gradāciju, tāpēc šis griezums vislabāk piemērots vidēji bieziem līdz bieziem cirtainiem matiem. | 6c05c969 |  |
| curly-wedge-bob.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-wedge-bob.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| curly-wedge-bob.grow_out | The stack relaxes into a curly bob after 3 months. | Pēc 3 mēnešiem apjoma pacēlums nosēžas un pārtop par cirtainu bobu. | 55766cf1 |  |
| curly-wedge-bob.client | A curly bob that is shorter and rounder at the back and a bit longer toward the front. | Cirtains bobs, kas aizmugurē ir īsāks un apaļāks, bet priekšpusē – nedaudz garāks. | 20254d49 |  |
| curly-wedge-bob.stylist | Cut dry, graduating the back in small clusters over the occipital area and keeping the sides and front longer so the curls stack smoothly. Weight: a rounded stack at the back with longer curls at the sides. | Griez sausos matos, veidojot aizmugurē graduāciju mazās šķipsnās virs pakauša kaula un atstājot sānus un priekšpusi garākus, lai lokas glīti kārtotos pakāpēs. Smagums: noapaļots apjoma pacēlums aizmugurē ar garākām lokām sānos. | b37df47c |  |
| curly-bob-with-fringe.name | Curly bob with fringe | Cirtains bobs ar priekšmatiem | ae8dec43 |  |
| curly-bob-with-fringe.texture_fit.wavy.note | waves need blow-drying for the fringe | viļņainiem matiem priekšmati būs jāfēno | e723d386 |  |
| curly-bob-with-fringe.density_fit.low.note | fine curls make a sparse fringe, so cut it fuller | smalkas cirtas priekšmatus padara retus, tāpēc griez tos biezākus | b46b38fe |  |
| curly-bob-with-fringe.growth.note | A front cowlick strongly affects a curly fringe, so check the direction of the hairline before cutting. | Virpulis priekšpusē būtiski ietekmē cirtainus priekšmatus, tāpēc pirms griešanas pārbaudi matu augšanas virzienu. | d97caf7d |  |
| curly-bob-with-fringe.strand_note | The fringe curl pattern is important; test how it springs before cutting. | Priekšmatu loku raksts ir svarīgs – pirms griešanas pārbaudi, cik ļoti lokas saraujas. | 848cc928 |  |
| curly-bob-with-fringe.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-bob-with-fringe.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| curly-bob-with-fringe.grow_out | The fringe moves into curtain-length curls in 8-10 weeks, and the bob then grows into a curly lob. | Priekšmati 8–10 nedēļu laikā ataug par aizkarveida lokām, un bobs pēc tam ataug par cirtainu lobu. | d6404b0e |  |
| curly-bob-with-fringe.client | A bouncy curly bob around the jaw with a short, springy fringe above the brows. | Atsperīgs cirtains bobs līdz žokļa līnijai ar īsiem, dzīvīgiem priekšmatiem virs uzacīm. | 5827f525 |  |
| curly-bob-with-fringe.stylist | Cut the fringe dry in a small triangle section, curl by curl, 3-4 cm longer than the target, then shape the bob outline round. Check the fringe length after the curls settle. Weight: rounded weight at the jaw with a springy fringe above the brows. | Griez priekšmatus sausos matos nelielā trīsstūrveida sekcijā, loku pa lokai, par 3–4 cm garākus par vēlamo garumu, pēc tam noapaļo boba kontūru. Pārbaudi priekšmatu garumu pēc loku iegulšanās. Smagums: noapaļots apjoms pie žokļa līnijas ar atsperīgiem priekšmatiem virs uzacīm. | 7b2ab6f8 |  |
| coily-sculpted-chin-bob.name | Sculpted coily bob | Skulpturāls sīkcirtains bobs | 6df1402f |  |
| coily-sculpted-chin-bob.texture_fit.curly.note | cut in stretched sections; see the Rounded curly bob | griez izstieptās šķipsnās; skaties: Rounded curly bob | 4765eb67 |  |
| coily-sculpted-chin-bob.density_fit.low.note | fine coils need a lighter shape to avoid flatness | smalkām sīkām lokām vajadzīga vieglāka forma, lai mati nesaplok | 8431abd7 |  |
| coily-sculpted-chin-bob.growth.note | Check the nape whorl, because coils bend sharply around it and can lift the back line. | Pārbaudi virpuli kakla zonā, jo sīkās lokas ap to krasi laužas un var pacelt aizmugurējo līniju. | 11d78182 |  |
| coily-sculpted-chin-bob.strand_note | Coily strands hold sculpted shapes; dense coils need careful debulking. | Sīki cirtaini mati labi notur skulpturālas formas; biezām lokām rūpīgi jāsamazina apjoms. | 8919aa58 |  |
| coily-sculpted-chin-bob.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| coily-sculpted-chin-bob.upkeep.products.1 | styling cream | ieveidošanas krēms | 01654a1c |  |
| coily-sculpted-chin-bob.grow_out | Grows into a coily lob at about 4 months; the shape is kept by trimming sections rather than a line. | Apmēram 4 mēnešu laikā ataug par sīki cirtainu lobu; formu saglabā, pielīdzinot matus pa sekcijām, nevis taisnā līnijā. | baa80056 |  |
| coily-sculpted-chin-bob.client | A chin-length natural bob with a clean, rounded shape. It can be worn defined or stretched. | Dabisks bobs līdz zodam ar tīru, noapaļotu formu. Vari to nēsāt gan ar izteiktām lokām, gan izstieptāku. | 5c8f7997 |  |
| coily-sculpted-chin-bob.stylist | Cut in stretched sections with a comb, then shape the outline dry on the stretched hair and refine it on the dry coils so the rounded edge sits just below the jaw. Weight: a defined, rounded outline at the chin that is trimmed in sections. | Griez ar ķemmi pa izstieptām šķipsnām, tad sausos, izstieptos matos izveido kontūru un pielīdzini to sausajās cirtās, lai noapaļotā mala gultos tieši zem žokļa līnijas. Apjoms: izteikta, noapaļota kontūra pie zoda, kas griezta pa šķipsnām. | 8b7249f1 |  |
| coily-sculpted-chin-bob.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| curly-asymmetric-bob.name | Curly asymmetric bob | Cirtains asimetrisks bobs | 89f0566d |  |
| curly-asymmetric-bob.texture_fit.wavy.note | waves need blow-drying to hold the angle | viļņaini mati jāieveido ar fēnu, lai noturētu leņķi | d1249fbe |  |
| curly-asymmetric-bob.density_fit.low.note | fine curls make the angle look weak, so keep it subtle | smalkās lokās leņķis izskatās neizteiksmīgs, tāpēc veido to neuzkrītošu | 7aaabe86 |  |
| curly-asymmetric-bob.growth.note | Match the longer side to the natural part, and check any crown whorl that pulls the curls to one side. | Pielāgo garāko pusi dabiskajam celiņam un pārbaudi virpuļus pakausī, kas var vilkt cirtas uz vienu pusi. | 5d4e5a3c |  |
| curly-asymmetric-bob.strand_note | Dense curls hold the difference between the sides. | Biezas lokas labi notur garuma atšķirību starp abām pusēm. | 6504b5f7 |  |
| curly-asymmetric-bob.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-asymmetric-bob.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| curly-asymmetric-bob.grow_out | Even out the shorter side over three months and return to a curly bob. | Trīs mēnešu laikā izlīdzini īsāko pusi un atgriezies pie cirtainā boba. | c100ac63 |  |
| curly-asymmetric-bob.client | A curly bob with one side longer than the other. | Cirtains bobs, kam viena puse ir garāka par otru. | 267065d9 |  |
| curly-asymmetric-bob.stylist | Cut the part first, then shape the longer side dry and match the shorter side to the curl length. Weight: one side kept longer, with the curls shaped to a rounded outline on both sides. | Vispirms griez pie celiņa, tad sausos matos izveido formu garākajai pusei un pielāgo īsāko pusi cirtu garumam. Apjoms: viena puse atstāta garāka, abās pusēs cirtām veidojot noapaļotu kontūru. | cc1af649 |  |
| asymmetric-coily-taper.name | Asymmetric coily taper | Asimetrisks sīkcirtains taper griezums | e82d6a23 |  |
| asymmetric-coily-taper.texture_fit.curly.note | needs curl shape and extra length; see the Curly asymmetric bob | vajadzīga loku forma un papildu garums; skaties: Curly asymmetric bob | 181dfbe0 |  |
| asymmetric-coily-taper.density_fit.low.note | fine coils show the asymmetry weakly | smalkās sīkās lokās asimetrija ir mazāk izteikta | 8581bfa1 |  |
| asymmetric-coily-taper.growth.note | The taper needs a clear hairline above the ear. | Taper pārejai virs auss vajadzīga tīra matu augšanas līnija. | e101fe5e |  |
| asymmetric-coily-taper.strand_note | Dense coils hold a sharp taper; fine coils reveal scalp on the tapered side, so choose a slightly longer guard. | Biezas sīkas lokas labi notur izteiktu taper pāreju; smalkās lokās pārejas pusē var spīdēt cauri galvas āda, tāpēc izvēlies nedaudz garāku uzgali. | 036ee66f |  |
| asymmetric-coily-taper.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| asymmetric-coily-taper.upkeep.products.1 | edge control | edge control želeja | f6121ce9 |  |
| asymmetric-coily-taper.grow_out | The tapered side fills in over 6-8 weeks; to grow out, lengthen the short side first and the cut becomes a shaped round crop. | Īsākā puse ataug 6–8 nedēļu laikā; lai griezumu ataudzētu, vispirms ļauj ataugt īsajai pusei, un tas pārtop glītā, noapaļotā crop formā. | 57845966 |  |
| asymmetric-coily-taper.client | A close-cropped natural cut with one side tapered short and the other left longer. It gives a sculpted, modern line. | Īss, dabisks griezums, kur viena puse veidota ar īsu taper pāreju, bet otra atstāta garāka. Tas rada skulpturālu, modernu līniju. | a5fc20b8 |  |
| asymmetric-coily-taper.stylist | Clipper-taper the short side from the temple back to the nape, stop at the parting, and cut the long side dry by sections so the curl cluster length stays even. Keep the contrast at least 4 cm so the asymmetry reads clearly. Weight: one side tapered close, the other side kept at jaw length. | Ar mašīnīti veido taper pāreju īsajā pusē no deniņiem līdz pakausim, apstājoties pie celiņa, un sausos matos pa šķipsnām griez garo pusi, lai cirtu kūlīšu garums būtu vienmērīgs. Saglabā vismaz 4 cm kontrastu, lai asimetrija būtu skaidri redzama. Apjoms: viena puse cieši noīsināta ar taper pāreju, otra atstāta līdz žokļa līnijai. | 8a35cd56 |  |
| asymmetric-coily-taper.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| shingle-bob.name | Shingle bob | Shingle bobs | a46dd060 |  |
| shingle-bob.texture_fit.curly.note | the taper is too close for curls | pāreja pie kakla lokām ir par īsu | b0af93f9 |  |
| shingle-bob.texture_fit.coily.note | see tapered-twa | skatīt tapered-twa | b0cc4a9f |  |
| shingle-bob.density_fit.low.note | fine hair looks very flat at the sides | smalki mati sānos izskatās ļoti pieglausti | b900e629 |  |
| shingle-bob.growth.note | The very short nape shows every growth pattern and whorl. | Ļoti īsā kakla daļa parāda ikvienu matu augšanas virzienu un virpuli. | ddefc691 |  |
| shingle-bob.strand_note | Smooth to wavy medium strands hold the graduated shape best; coarse hair stands off the nape. | Gludi līdz viļņaini, vidēji biezi mati vislabāk notur graduēto formu; raupji mati pie kakla mēdz slieties gaisā. | 35a1ef23 |  |
| shingle-bob.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| shingle-bob.upkeep.products.1 | smoothing serum | nogludinošs serums | 7074d46d |  |
| shingle-bob.grow_out | The nape grows out first, so the shape becomes a graduated bob within about 8 weeks. | Kakla daļa ataug pirmā, tāpēc aptuveni 8 nedēļu laikā forma pārtop graduētā bobā. | df44e7b1 |  |
| shingle-bob.client | A neat, short bob that is very tight at the neck, with a rounded shape at the crown. Classic and polished. | Glīts, īss bobs, kas pie kakla pieguļ pavisam cieši, bet virspusē veido noapaļotu formu. Klasisks un kopts. | 1595685a |  |
| shingle-bob.stylist | Clipper-taper the nape up to the occipital and cut the sides in a rounded line around the ear. Weight: tight clipper taper at the nape that opens into a longer rounded bob at the crown. | Ar mašīnīti veido taper pāreju kakla daļā līdz pakauša kaulam un sānos griez noapaļotu līniju ap ausi. Apjoms: izteikta mašīnītes taper pāreja kakla daļā, kas virspusē pāriet garākā, noapaļotā bobā. | fbb9e71c |  |
| midi-butterfly.name | Shoulder-length butterfly cut | Butterfly griezums līdz pleciem | 80c21883 |  |
| midi-butterfly.texture_fit.curly.note | cut dry on loose waves; keep the upper tier longer | viegli viļņainus matus griez sausus; augšējo kārtu atstāj garāku | 507f44d7 |  |
| midi-butterfly.texture_fit.coily.note | see curly-butterfly | skaties: curly-butterfly | af00e4b8 |  |
| midi-butterfly.density_fit.low.note | fine hair loses density from the lower tier, so keep it blunt | smalki mati zaudē blīvumu apakšējā kārtā, tāpēc atstāj to taisnu | cf72861e |  |
| midi-butterfly.growth.note | Crown layers highlight any cowlick, so choose the upper tier length with the whorl in mind. | Pakāpe virspusē izceļ virpuļus, tāpēc augšējā slāņa garumu izvēlies, ņemot vērā to augšanas virzienu. | cfa54a4d |  |
| midi-butterfly.strand_note | Fine to medium strands gain from the added movement. Thick strands need less cutting in the upper tier. | Smalkiem līdz vidēji bieziem matiem papildu kustīgums nāk tikai par labu. Bieziem matiem augšējā kārtā jāizgriež mazāk. | 1c729535 |  |
| midi-butterfly.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| midi-butterfly.upkeep.products.1 | volumising mousse | apjoma putas | 07b4f2db |  |
| midi-butterfly.grow_out | Grows into a long layered cut without a clear grow-out line. | Ataug garā, pakāpeniskā griezumā bez izteiktas ataugšanas līnijas. | e55cf44f |  |
| midi-butterfly.client | A layered cut with short, bouncy pieces around the face and longer lengths beneath. | Kaskādes griezums ar īsākām, atsperīgām šķipsnām ap seju un garākiem matiem apakšā. | dd38d7b2 |  |
| midi-butterfly.stylist | Create a shorter upper layer from the crown to the cheekbones using elevated cutting, keep the lower layer long and link the two tiers without a visible step. Weight: two tiers of layers: a short upper tier around the crown and face, a long lower tier. | Ar šķipsnu pacēlumu veido īsāku augšējo slāni no pakauša virsotnes līdz vaigu kauliem, apakšējo slāni atstāj garu un savieno abus līmeņus bez redzama pakāpiena. Apjoms: divu līmeņu pakāpe — īss augšējais slānis ap virspusi un seju, garš apakšējais slānis. | bfaab1d4 |  |
| long-butterfly.name | Long butterfly cut | Garais butterfly griezums | b68e3e36 |  |
| long-butterfly.texture_fit.curly.note | cut dry and keep the upper tier longer | griez sausus un atstāj augšējo kārtu garāku | 9ff2bf97 |  |
| long-butterfly.texture_fit.coily.note | keep the lower tier unchanged and shape the upper tier as in Curly butterfly | apakšējo kārtu atstāj nemainītu, bet augšējo veido kā griezumā Curly butterfly | ca99fbe8 |  |
| long-butterfly.density_fit.low.note | fine hair loses density in the lower tier, so keep it blunt | smalki mati zaudē blīvumu apakšējā kārtā, tāpēc atstāj to taisnu | a246623d |  |
| long-butterfly.growth.note | Crown layers reveal a cowlick, so choose the upper tier length around the whorl. | Pakāpe pakauša virspusē izceļ virpuli, tāpēc augšējā slāņa garumu pielāgo tā augšanas vietai. | 0aa3709d |  |
| long-butterfly.strand_note | Fine to medium strands move well; thick strands need only a light upper tier. | Smalki līdz vidēji biezi mati iegūst skaistu kustīgumu; bieziem matiem pietiek ar vieglu augšējo kārtu. | 5fc17d91 |  |
| long-butterfly.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| long-butterfly.upkeep.products.1 | volumising mousse | apjoma putas | 07b4f2db |  |
| long-butterfly.grow_out | Grows out as long layers, with a visible upper tier for about 3 months. | Ataug kā garš pakāpenisks griezums, saglabājot pamanāmu augšējo slāni aptuveni 3 mēnešus. | 45ae3c0e |  |
| long-butterfly.client | A long layered cut with short bouncy pieces around the face and a long bottom layer. | Garš kaskādes griezums ar īsām, atsperīgām šķipsnām ap seju un garu apakšējo kārtu. | 1f71e52a |  |
| long-butterfly.stylist | Cut a short upper tier from the crown to the cheekbone using elevated cutting, with the lower length kept long, blending the join with point cutting. Weight: short upper tier from crown to cheek, long lower tier at the perimeter. | Ar šķipsnu pacēlumu nogriez īsu augšējo slāni no pakauša virsotnes līdz vaigu kaulam, apakšējo daļu atstāj garu un pāreju sapludini point cut tehnikā. Apjoms: īss augšējais slānis no virspuses līdz vaigu kaulam, garš apakšējais slānis pa perimetru. | 50c89aac |  |
| curly-butterfly.name | Curly butterfly | Cirtains butterfly griezums | ebd0305c |  |
| curly-butterfly.texture_fit.wavy.note | waves need styling | viļņainiem matiem vajadzīga ieveidošana | 2ae4dbde |  |
| curly-butterfly.density_fit.low.note | fine curls lose density, so layer lightly | smalkas lokas zaudē blīvumu, tāpēc veido pavisam vieglas kārtas | a99cad11 |  |
| curly-butterfly.growth.note | The upper tier sits on the crown and highlights whorls, so lengthen the layers around them. | Augšējais slānis gulstas pakauša virspusē un izceļ virpuļus, tāpēc ap tiem pakāpi atstāj nedaudz garāku. | 38ffd93c |  |
| curly-butterfly.strand_note | Medium to thick curls hold the two tiers; fine curls need the lower tier left fuller. | Vidēji un biezi cirtaini mati labi notur abas kārtas; smalkām lokām apakšējā kārta jāatstāj biezāka. | d3fb682b |  |
| curly-butterfly.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-butterfly.upkeep.products.1 | curl-defining gel | želeja cirtu izcelšanai | c3f5576c |  |
| curly-butterfly.grow_out | The upper tier lengthens into long curly layers over about 3 months, with the two tiers merging without a visible step. | Augšējais slānis aptuveni 3 mēnešu laikā pārtop garās cirtainās pakāpēs, abiem līmeņiem saplūstot bez redzama pakāpiena. | da315727 |  |
| curly-butterfly.client | Curls that land at the shoulders when dry, with a shorter, bouncy layer around the face and crown for volume. Pulled straight, they reach the shoulder blades. | Lokas, kas sausas sniedzas līdz pleciem, ar īsāku, atsperīgu kārtu ap seju un galvvidū apjomam. Izstieptas tās sniedzas līdz lāpstiņām. | 0357583e |  |
| curly-butterfly.stylist | Cut the shorter upper tier dry from crown to cheekbone, curl by curl, leaving it 2-3 cm longer than the final length, then blend it into the long lower tier. Weight: short upper tier of curls around the crown and face with a long lower tier. Tight coils shrink more and land nearer the collarbone. | Sausos matos cirtu pa cirtai nogriez īsāko augšējo slāni no pakauša virsotnes līdz vaigu kaulam, atstājot to par 2–3 cm garāku par vēlamo garumu, tad sapludini ar garo apakšējo slāni. Apjoms: īss cirtu slānis ap virspusi un seju, garš apakšējais slānis. Sīkākas cirtas sarausies vairāk un gulsies tuvāk atslēgas kaulam. | ca165f62 |  |
| buzz-cut-women.name | Buzz cut | Buzz cut | 05edf8a9 | same |
| buzz-cut-women.density_fit.low.note | very fine hair may show the scalp | ļoti smalkos matos var spīdēt cauri galvas āda | e20130b2 |  |
| buzz-cut-women.growth.note | Clipper marks show the growth direction at whorls and the hairline; cut with the grain on the first pass. | Mašīnītes pēdas parāda matu augšanas virzienu pie virpuļiem un matu līnijas; pirmajā piegājienā griez matu augšanas virzienā. | aecb1af7 |  |
| buzz-cut-women.strand_note | Strands show their natural density; fine hair can reveal scalp. | Izceļas matu dabiskais blīvums; cauri smalkiem matiem var spīdēt galvas āda. | 9c1d3c43 |  |
| buzz-cut-women.upkeep.products.0 | scalp moisturiser | mitrinošais līdzeklis galvas ādai | 993f6ec1 |  |
| buzz-cut-women.upkeep.products.1 | sunscreen | saules aizsargkrēms | c07dcf01 |  |
| buzz-cut-women.grow_out | Grows to a micro pixie in about 4 weeks. | Aptuveni 4 nedēļu laikā izaug par mikro piksiju. | af007626 |  |
| buzz-cut-women.client | A very short, even crop that needs almost no care. Dramatic, bold and easy. | Ļoti īss, vienmērīgs griezums, kas neprasa gandrīz nekādu kopšanu. Spilgts, drosmīgs un ērts. | 0dd5abd1 |  |
| buzz-cut-women.stylist | Use one guard all over, or a slightly longer guard on top; blend around the ears and nape with a lever. Weight: none; one clipper length all over. | Izmanto vienu uzgali visai galvai vai nedaudz garāku uzgali virspusē; ap ausīm un kakla daļā sapludini ar mašīnītes sviru. Apjoms: nav; viens mašīnītes garums visai galvai. | 615a5dc9 |  |
| buzz-1-uniform.name | Buzz cut, #1 all over | Buzz cut, viscaur ar 1. uzgali | a3d7519f |  |
| buzz-1-uniform.sideburns | Same guard, squared lightly | Tas pats uzgalis, viegli ielīdzinātas taisni | b56ec09f |  |
| buzz-1-uniform.texture_fit.curly.note | Hair lies close; curl pattern reads as a texture, not as shape. | Mati pieguļ galvai; cirtu raksts veido tekstūru, nevis formu. | 3bb1d750 |  |
| buzz-1-uniform.texture_fit.coily.note | Very short coils sit flat; check scalp for razor bumps and use a guard no shorter than #1 if it irritates. | Ļoti īsas, ciešas cirtas pieguļ galvai; pārbaudi, vai uz galvas ādas nav skūšanās izsitumu, un kairinājuma gadījumā neizmanto par #1 īsāku uzgali. | 7181853d | safety; checked |
| buzz-1-uniform.growth.whorl_note | A crown whorl is invisible at 3 mm; a cowlick may stand slightly. | 3 mm garumā virpulis virspusē nav pamanāms; nepakļāvīgs matu kūlītis var nedaudz sacelties. | bf43ca74 |  |
| buzz-1-uniform.growth.note | Covers recession well because top and sides are the same length; works at every stage of recession. | Labi nomaskē atkāpušos matu līniju, jo augšpuse un sāni ir vienāda garuma; piemērots jebkurai matu atkāpšanās stadijai. | d01022fe |  |
| buzz-1-uniform.density_note | Suits any density; thin hair shows scalp because there is no length to cover it. Coarse hair feels bristly at 3 mm. | Piemērots jebkuram matu biezumam; plāniem matiem būs redzama galvas āda, jo trūkst garuma, kas to nosegtu. Rupji mati 3 mm garumā būs saraini. | 68d2d7ef |  |
| buzz-1-uniform.glasses_note | Nothing to manage around the arms; glasses frames become the main feature. | Ap kājiņām mati netraucē; briļļu rāmis kļūst par galveno akcentu. | 43370977 |  |
| buzz-1-uniform.grow_out | Grows into a rough crew in about 6 weeks; stop at #3 then add scissor top. | Aptuveni 6 nedēļu laikā ataug vieglā crew cut formā; ļauj izaugt līdz #3 uzgaļa garumam, pēc tam augšpusi veido ar šķērēm. | bdeab502 |  |
| buzz-2-uniform.name | Buzz cut, #2 all over | Buzz cut, viscaur ar 2. uzgali | 03f785d9 |  |
| buzz-2-uniform.client | The same short length everywhere, about 6 mm. Tidy, quick and needs no styling at all. | Vienāds, īss garums viscaur, apmēram 6 mm. Kopts, ātrs un vispār neprasa ieveidošanu. | f3525ba6 |  |
| buzz-4-uniform.name | Buzz cut, #4 all over | Buzz cut, viscaur ar 4. uzgali | 0c3b4e0e |  |
| buzz-4-uniform.client | A short but soft buzz, about 5 mm longer than a military cut. Easy to live with. | Īss, bet mīksts buzz cut, apmēram par 5 mm garāks nekā militārais griezums. Ļoti ērts ikdienā. | e2e68ec0 |  |
| buzz-1-uniform.client | The same very short length all over, about 3 mm. No styling at all. | Vienāds, ļoti īss garums viscaur, apmēram 3 mm. Nekādas ieveidošanas. | a1a64183 |  |
| buzz-1-uniform.stylist | Clipper bare (no comb) with a #1 guard, against the grain with light pressure; check the back of the crown for patchy passes. Edge the hairline lightly. Leave the natural edge; only clean the strays. | Griez ar mašīnīti un #1 uzgali (bez papildu ķemmes), pret matu augšanas virzienu ar vieglu spiedienu; pārbaudi pakauša aizmuguri, vai nav palikuši nevienmērīgi nogriezti laukumi. Viegli iezīmē matu līniju. Atstāj dabisku kontūru, notīrot tikai atsevišķus liekos matiņus. | e3efd079 |  |
| buzz-tapered.name | Tapered buzz cut | Buzz cut ar taper pāreju | bfb826cf |  |
| buzz-tapered.fade.note | Taper from #2 down to #1 or blade over the last 2-3 cm at ears and neck; no skin. | Taper pāreja no 2. uz 1. uzgali vai asmeni pēdējos 2–3 cm pie ausīm un kakla; ne līdz ādai. | 9a1c6845 |  |
| buzz-tapered.sideburns | Tapered to #1 | Pāreja uz 1. uzgali | 6647a613 |  |
| buzz-tapered.texture_fit.coily.note | Cleaner on coily hair than a blunt buzz; tapered edge shows the line-up. | Sīki cirtainiem matiem izskatās koptāk nekā vienlaidu buzz; taper pāreja izceļ matu kontūru. | 8c37d8b2 |  |
| buzz-tapered.growth.whorl_note | No special handling. | Īpaša pieeja nav vajadzīga. | a2f624a7 |  |
| buzz-tapered.growth.note | Works well up to stage 5-6; keep the front guard the same as the top so the hairline stays soft. | Labi izskatās līdz pat 5.–6. stadijai; priekšpusē izmanto tādu pašu uzgali kā augšpusē, lai matu augšanas līnija saglabātos maiga. | 2ca9bd9e |  |
| buzz-tapered.density_note | Works at any density; thin hair benefits from the longer top. | Piemērots jebkuram matu biezumam; plāniem matiem nāk par labu garāka augšpuse. | f68f9ecd |  |
| buzz-tapered.glasses_note | Clean around the arms; the taper stays below the frame line. | Ap kājiņām izskatās kārtīgi; taper pāreja paliek zem rāmja līnijas. | 310c2c3c |  |
| buzz-tapered.grow_out | Becomes a crew cut in about 5 weeks. | Aptuveni 5 nedēļu laikā pārtop par crew cut griezumu. | dc47d1ba |  |
| buzz-tapered.client | Short all over with the sides and neckline neatly tapered shorter. Very tidy, no styling. | Īss viscaur, ar glītu pāreju sānos un pie kakla līnijas. Ļoti kopts un bez ieveidošanas. | 0e7d1bfa |  |
| buzz-tapered.stylist | Top #3 to #4, sides #2 fading to #1 or blade over the lower third. Blend in a C-shape around the ear, soften the sideburn without lining it. Tapered into the natural neck edge. | Augšpusē #3 līdz #4 uzgalis, sānos #2 ar pāreju uz #1 vai asmeni apakšējā trešdaļā. Sapludini ar C veida kustību ap ausi, padarot vaigubārdas līniju maigu bez asas kontūras. Kakla daļā veido taper pāreju dabiskajā matu līnijā. | 1a64077a |  |
| buzz-skin-fade.name | Buzz cut with skin fade | Buzz cut ar skin fade | 9b0f784a |  |
| buzz-skin-fade.fade.note | Skin up to #2 across 3-5 cm; top matches #2 so the blend is smooth. | No ādas līdz 2. uzgalim 3–5 cm platumā; augšpuse atbilst 2. uzgalim vienmērīgai pārejai. | 2bbbfdfd |  |
| buzz-skin-fade.sideburns | Faded to skin | Izpludinātas līdz ādai | 3ee550d5 |  |
| buzz-skin-fade.texture_fit.coily.note | Strong contrast on coily hair; shape-up with a trimmer sharpens it. | Izteikts kontrasts sīki cirtainiem matiem; kontūru iezīmēšana ar trimmeri piešķir griezumam īpašu asumu. | 423b7133 |  |
| buzz-skin-fade.growth.note | Good for stage 3-6 as it removes contrast between thin and dense areas. | Labi piemērots 3.–6. stadijai, jo novērš kontrastu starp retākām un biezākām zonām. | d77d3e25 |  |
| buzz-skin-fade.density_note | Any; thin hair shows scalp at the faded area but not on top. | Jebkuram biezumam; plāniem matiem galvas āda ir redzama pārejas zonā, bet ne virspusē. | f2216ca5 |  |
| buzz-skin-fade.glasses_note | Fade sits above the arms; check no hair is left poking out behind the ear. | Fade līnija atrodas virs kājiņām; pārbaudi, vai aiz auss nepaliek spurojošies matiņi. | c3c5854f |  |
| buzz-skin-fade.grow_out | Grows into a #2 buzz with taper in 3-4 weeks. | 3–4 nedēļu laikā ataug par #2 buzz griezumu ar taper pāreju. | 7b0ea295 |  |
| buzz-skin-fade.client | Very short on top with the sides faded right down to skin. Sharp and very low effort. | Augšpusē pavisam īsi mati, sānos – fade līdz pat ādai. Precīzs griezums, kas neprasa gandrīz nekādas pūles. | 4c3b8f43 |  |
| buzz-skin-fade.stylist | Foil shaver or zero-gap blade for the skin area; flick out to #1 then #2 and hold the blend line level. Keep top at #2 to avoid a hard line. Skin-faded neckline, rounded or squared on request. | Pārejai līdz ādai izmanto sietiņskuvekli vai mašīnīti ar nulles atstarpi (zero-gap); ar vieglu kustību izej uz #1 un tad uz #2 uzgali, saglabājot vienmērīgu pārejas līniju. Augšpusi atstāj pie #2, lai neveidotos asa robeža. Kakla līnija ar skin fade, pēc klienta vēlēšanās noapaļota vai taisna. | 4dc71ebc |  |
| shaved-head.name | Shaved head (razor or foil) | Skūta galva (ar skuvekli vai šeiveri) | 0bc60675 |  |
| shaved-head.sideburns | Removed | Noskūtas | 4118fb4f |  |
| shaved-head.texture_fit.coily.note | Razor bumps are common on tight coils; use a shave-friendly cream and rest the skin. | Ciešām cirtām pēc skūšanās bieži mēdz rasties izsitumi; lieto saudzīgu skūšanās krēmu un ļauj ādai atpūsties. | 2c323cb2 |  |
| shaved-head.growth.whorl_note | No whorl visible. | Virpuļi nav redzami. | 9d984fcf |  |
| shaved-head.growth.note | Ends the conversation about hairline; common choice for stage 5-7. | Reizi par visām reizēm atrisina jautājumu par atkāpušos matu līniju; populāra izvēle 5.–7. stadijā. | 90c6d684 |  |
| shaved-head.density_note | Density does not matter: this works at any density and removes the contrast between thin and dense areas. | Biezumam nav nozīmes: piemērots jebkuram biezumam un pilnībā novērš kontrastu starp retākām un biezākām zonām. | 301a5434 |  |
| shaved-head.glasses_note | Frames sit on a clean canvas. | Briļļu rāmis izceļas uz pilnīgi tīra fona. | 23a84478 |  |
| shaved-head.upkeep.products.0 | shave cream | skūšanās krēms | 4146a3ec |  |
| shaved-head.upkeep.products.1 | moisturiser | mitrinošs krēms | 7f4d40d6 |  |
| shaved-head.upkeep.products.2 | SPF | SPF aizsargkrēms | 155285ad |  |
| shaved-head.grow_out | About 3 weeks to a #1-length buzz, 8 weeks to a crew-length top. | Aptuveni 3 nedēļas līdz #1 garuma buzz griezumam, 8 nedēļas līdz crew garumam virspusē. | 1caed386 |  |
| shaved-head.client | Completely smooth head. Shaved every few days, kept moisturised, with sun protection. | Pilnīgi gluda galva. Jāskuj ik pēc dažām dienām, regulāri jāmitrina un jāsargā no saules. | cc778273 |  |
| shaved-head.stylist | Clippers first at #0, then foil or razor with warm towels and pre-shave oil. Never against the grain on sensitive scalp; finish with cold towel and balm. Smooth all the way down. | Vispirms noņem ar mašīnīti pie #0, pēc tam skuj ar sietiņskuvekli vai bārdasnazi, izmantojot siltus dvieļus un pirmsskūšanās eļļu. Jutīgai galvas ādai nekad neskuj pret spalvu; nobeigumā liec aukstu dvieli un uzklāj balzamu. Gluds rezultāts visā galvā. | 9964b0d6 |  |
| buzz-longer-front.name | Buzz with longer front | Buzz ar garāku priekšpusi | fbc25f7f |  |
| buzz-longer-front.sideburns | Short | Īsas | f5d61ead |  |
| buzz-longer-front.growth.note | Front is a touch longer than the rest; avoids a harsh trimmer line on a hairline that is higher at the temples. | Priekšpuse ir nedaudz garāka par pārējo; tas palīdz izvairīties no asas trimmera līnijas, ja deniņos matu līnija ir augstāka. | cee527a7 |  |
| buzz-longer-front.density_note | Thin to medium hair; works with a hairline that is higher at the temples or a thin crown. | Plāniem līdz vidēji bieziem matiem; piemērots, ja deniņos matu līnija ir augstāka vai pakauša virspusē mati ir retāki. | a4dbe7ef |  |
| buzz-longer-front.glasses_note | No interaction with the arms; short sides leave frames clear. | Nekādas saskares ar kājiņām; īsie sāni atstāj briļļu rāmi pilnīgi brīvu. | 86c90c77 |  |
| buzz-longer-front.grow_out | Grow the whole top for 4 weeks and it becomes a crew cut. | Audzē visu augšpusi 4 nedēļas, un tas pārtaps par crew cut griezumu. | 44fad534 |  |
| buzz-longer-front.client | A short buzz that leaves the front slightly longer so the hairline looks soft. | Īss buzz griezums ar nedaudz garāku priekšpusi, lai matu augšanas līnija izskatītos maigāka. | 4259b38e |  |
| buzz-longer-front.stylist | Do not line up the front with trimmers; blend with the clipper and a guard one number higher. | Neveido asu priekšējo līniju ar trimmeri; sapludini ar mašīnīti, izmantojot par vienu numuru lielāku uzgali. | fb5c3f9f |  |
| executive-scissor.name | Executive scissor cut | Lietišķs šķēru griezums | 2306eb7a |  |
| executive-scissor.sideburns | Mid-ear length | Līdz auss vidum | 96e7a349 |  |
| executive-scissor.texture_fit.curly.note | Dry-cut for curls. | Cirtas griez sausos matos. | bf762ad9 |  |
| executive-scissor.texture_fit.coily.note | Scissor cut a rounded top. | Augšpusi griez ar šķērēm, veidojot noapaļotu formu. | 1b9986a8 |  |
| executive-scissor.growth.note | Neutral; part conceals mild recession. | Neitrāls; celiņš palīdz piesegt nelielu matu atkāpšanos. | 17b46cca |  |
| executive-scissor.density_note | Any density; the length on top is easy to adjust for thinner hair. | Jebkuram biezumam; garumu virspusē ir viegli pielāgot plānākiem matiem. | 74477968 |  |
| executive-scissor.glasses_note | Sits well with most frames; keep hair above the ear short so the arms rest cleanly. | Labi sader ar lielāko daļu rāmju; virs ausīm matus atstāj īsus, lai briļļu kājiņas ērti piegultu. | 267e7433 |  |
| executive-scissor.upkeep.products.0 | light pomade | vieglas fiksācijas pomāde | ccc6c968 |  |
| executive-scissor.grow_out | Just grow: a natural top flows from this in about 8 weeks. | Vienkārši audzē: aptuveni 8 nedēļu laikā mati dabiski ataugs brīvā formā. | e7d9ec88 |  |
| executive-scissor.client | A classic haircut with short tidy sides and a natural top. Fits professional settings. | Klasisks griezums ar īsiem, kārtīgiem sāniem un dabisku augšpusi. Lieliski piemērots lietišķai videi. | f2bd3c21 |  |
| executive-scissor.stylist | All-scissor work: shear-over-comb on the sides, a point-cut top at 4-7 cm, no clipper lines. Check the ear and neckline for tidiness every visit. Tapered a little for tidiness. | Viss darbs tikai ar šķērēm: sānos šķēres pāri ķemmei, virspuse nogriezta point-cut tehnikā 4–7 cm garumā, bez mašīnītes līnijām. Katrā apmeklējumā pārbaudi zonu ap ausīm un kakla līniju. Koptam izskatam pie kakla izveido vieglu taper pāreju. | fe94ee07 |  |
| short-back-sides-connected.name | Connected short back and sides | Īsi sāni un aizmugure ar plūstošu pāreju | 2707dfde |  |
| short-back-sides-connected.fade.note | Connected: side length graduates into the top without a ridge. | Savienots: sānu garums pakāpeniski pāriet augšpusē bez kantes. | b48e03a6 |  |
| short-back-sides-connected.sideburns | Mid length | Vidēja garuma | 235563ec |  |
| short-back-sides-connected.texture_fit.coily.note | Cut with a taper on the sides and keep the top 3-4 cm for a shaped, structured finish. | Griez ar taper pāreju sānos un atstāj augšpusē 3–4 cm, lai iegūtu koptu un strukturētu formu. | 6cc2e4ec |  |
| short-back-sides-connected.growth.note | A side part conceals stage 2-3. | Sānu celiņš palīdz piesegt 2.–3. stadiju. | b36a2ae1 |  |
| short-back-sides-connected.density_note | Any density; the connected taper looks even on both fine and thick hair. | Jebkuram biezumam; savienotā taper pāreja izskatās vienmērīgi gan smalkos, gan biezos matos. | fbb989bb |  |
| short-back-sides-connected.glasses_note | Fits any frame. | Piemērots jebkuram rāmim. | 810de374 |  |
| short-back-sides-connected.upkeep.products.0 | light pomade | vieglas fiksācijas pomāde | ccc6c968 |  |
| short-back-sides-connected.grow_out | Grow the top for 6-8 weeks and it becomes an Ivy League. | Audzē augšpusi 6–8 nedēļas, un tas pārtaps par Ivy League griezumu. | f48d01f4 |  |
| short-back-sides-connected.client | A classic barber cut with tidy sides that blend into a natural top. Looks smart everywhere. | Klasisks bārberu griezums ar kārtīgiem sāniem, kas plūstoši pāriet dabiskā augšpusē. Izskatās eleganti jebkurā situācijā. | 12f61d13 |  |
| short-back-sides-connected.stylist | Clipper-over-comb with #3 to #1 graduation and a slide cut to remove the weight line. Neck tapered, top point-cut. | Mašīnīte pāri ķemmei ar pāreju no #3 uz #1 un slīdošais griezums (slide cut), lai noņemtu smaguma līniju. Kakla daļā taper pāreja, virspuse nogriezta point-cut tehnikā. | 198fc6b3 |  |
| crew-cut-classic.name | Classic crew cut | Klasisks crew cut | d44be7c8 |  |
| crew-cut-classic.fade.note | Gentle taper from #3 at the top of the side down to #1 at the ears and nape. | Plūstoša taper pāreja no #3 sānu augšdaļā līdz #1 pie ausīm un kakla līnijas. | 1b89b365 |  |
| crew-cut-classic.sideburns | Tapered, kept short | Ar taper pāreju, atstāti īsi | 743a6b00 |  |
| crew-cut-classic.texture_fit.curly.note | Keep top at the 3 cm end so curls stay controlled. | Augšpusi atstāj ap 3 cm garu, lai cirtas saglabātu formu un nepūkoties. | c3617fa7 |  |
| crew-cut-classic.texture_fit.coily.note | Pick the 2 cm end; brush upward for a short natural top. | Izvēlies ap 2 cm garumu; ķemmē uz augšu, lai iegūtu īsu, dabisku formu. | 205f9c7d |  |
| crew-cut-classic.density_fit.low.note | Keep the top at the shorter end and texture it so less scalp shows. | Augšpusi atstāj īsāku un piešķir tekstūru, lai galvas āda mazāk spīdētu cauri. | 9a800c7f |  |
| crew-cut-classic.growth.whorl_note | Cowlick at the front needs the longer end of the range. | Ja priekšpusē ir nepakļāvīgs virpulis, izvēlies garāko no ieteiktajiem variantiem. | db8b47c6 |  |
| crew-cut-classic.growth.note | Brushed-up front shows the hairline; a messy variation is easier on stage 4-5 (see 'Messy textured crew'). | Uz augšu pacelta priekšpuse atsedz matu augšanas līniju; 4.–5. stadijai piemērotāka būs nedaudz nekārtīga variācija (skat. «Messy textured crew»). | d02d7b49 |  |
| crew-cut-classic.density_note | Good for medium to thick; fine hair shows scalp through the top. | Labi piemērots vidēji bieziem līdz bieziem matiem; smalkos matos virspusē spīdēs cauri galvas āda. | bcf72f83 |  |
| crew-cut-classic.glasses_note | Short sides leave the arms clear; confirm no bulky blend sits behind the ear. | Īsie sāni atstāj brīvas briļļu kājiņas; pārliecinies, ka aiz auss nepaliek pārlieku bieza pāreja. | 235fdc2a |  |
| crew-cut-classic.upkeep.products.0 | matte clay or paste | matēts māls vai pasta | 6b8407ad |  |
| crew-cut-classic.grow_out | Grows to a rough Ivy League over 8-10 weeks. | 8–10 nedēļu laikā ataug vieglā Ivy League formā. | a5b939b2 |  |
| crew-cut-classic.client | Short on the sides, a little longer on top that can stand up or be brushed forward. Very low effort. | Īsi sāni un nedaudz garāka augšpuse, ko var pacelt uz augšu vai ķemmēt uz priekšu. Prasa minimālas pūles. | ad031083 |  |
| crew-cut-classic.stylist | Clipper with comb, #3 to #1 taper; scissor-over-comb on the top, leaving about 2 cm at the front. Graduate the length so the top does not look flat. Natural taper into the neck. | Mašīnīte ar ķemmi, pāreja no #3 uz #1; augšdaļā šķēres pāri ķemmei, priekšpusē atstājot apmēram 2 cm. Pakāpeniski veido garumu, lai augšpuse neizskatītos plakana. Dabiska pāreja uz kakla līniju. | 86e43274 |  |
| crew-cut-long.name | Long crew cut | Pagarināts crew cut | a03b1340 |  |
| crew-cut-long.fade.note | Taper from #4 to #2 on the sides, more length on the top. | Taper pāreja sānos no #4 līdz #2, augšpusē atstājot lielāku garumu. | b8fdf4fd |  |
| crew-cut-long.sideburns | Short, tapered | Īsi, ar taper pāreju | b33481a3 |  |
| crew-cut-long.texture_fit.curly.note | Leave the top slightly shorter so the curls bounce rather than puff. | Augšpusi atstāj nedaudz īsāku, lai cirtas būtu atsperīgas, nevis pūkoties. | 2ff739df |  |
| crew-cut-long.texture_fit.coily.note | 3-4 cm lets the top form soft tight curls; style with curl cream. | 3–4 cm ļauj augšpusē veidoties mīkstām, izteiktām cirtām; ieveidošanai lieto cirtu krēmu. | b75a2f44 |  |
| crew-cut-long.density_fit.low.note | Use a texturising powder so the top does not lie flat. | Lieto teksturējošo pūderi, lai mati augšpusē nepiegultu plakani. | 3d28d14d |  |
| crew-cut-long.growth.whorl_note | Longer top covers a thin crown mildly; trim cowlicks shorter. | Garāka augšdaļa nedaudz piesedz retākus matus pakausī; virpuļus apgriez īsākus. | a12fe613 |  |
| crew-cut-long.growth.note | Brushing forward keeps temples covered at stage 3-4; avoid brushing straight up. | Ķemmējot uz priekšu, 3.–4. stadijā deniņi paliek piesegti; izvairies ķemmēt taisni uz augšu. | 38a37761 |  |
| crew-cut-long.density_note | Medium to thick; fine hair needs a texturising powder to avoid collapse. | Vidēji bieziem līdz bieziem matiem; smalkiem matiem nepieciešams teksturējošs pūderis, lai tie nesakristu. | f95abef7 |  |
| crew-cut-long.glasses_note | Fits any frame; keep sideburns narrow. | Piestāv jebkuriem ietvariem; vaigubārdu saglabā šauru. | 5ea6f8ea |  |
| crew-cut-long.upkeep.products.0 | matte clay | matēts māls | 37b1eb2f |  |
| crew-cut-long.upkeep.products.1 | sea-salt spray (optional) | jūras sāls sprejs (pēc izvēles) | ec66fa36 |  |
| crew-cut-long.grow_out | Moves to Ivy League in 3-4 weeks. | 3–4 nedēļās pārtop par Ivy League. | 5d913d8e |  |
| crew-cut-long.client | A relaxed crew cut with enough length on top to style forward or up. Short sides and a tidy outline. | Brīvāks crew cut ar pietiekamu garumu augšpusē, lai matus ieveidotu uz priekšu vai uz augšu. Īsi sāni un tīras kontūras. | 4cd51f7e |  |
| crew-cut-long.stylist | Slide cut the top with scissors over comb to remove bulk, point cut the front for texture. Check balance at the corners. | Augšdaļā izmanto slīdošo griezumu (slide cut) ar šķērēm pāri ķemmei, lai noņemtu lieko biezumu; priekšpusi iestrādā ar point cut tehniku tekstūrai. Pārbaudi līdzsvaru stūros. | 7071eed3 |  |
| ivy-league.name | Ivy League cut | Ivy League griezums | bae19c78 |  |
| ivy-league.fade.note | Taper only; sides lightly blended, never skin. | Tikai taper pāreja; sāni viegli sapludināti, nekad ne līdz ādai. | 4b4480b7 |  |
| ivy-league.sideburns | Clean, mid-ear length | Kārtīgi, līdz auss vidum | ae2208cb |  |
| ivy-league.texture_fit.curly.note | Dry-cut the top so curls can be assessed before final length. | Augšpusi griez sausos matos, lai novērtētu cirtas pirms gala garuma noteikšanas. | 27b78b10 |  |
| ivy-league.texture_fit.coily.note | A short 'Ivy' reads as a neat top with taper; shape top with a brush. | Īss «Ivy League» izskatās kā kārtīga augšpuse ar taper pāreju; formu veido ar suku. | 546e2cf2 |  |
| ivy-league.density_fit.low.note | Wear a soft natural part; a sharp part line shows the scalp. | Veido maigu, dabisku celiņu; izteikta līnija pārāk atsegs galvas ādu. | ed50b25a |  |
| ivy-league.growth.whorl_note | A crown cowlick may break the part; choose the part side to suit it. | Pakauša virpulis var izjaukt celiņu; izvēlies celiņa pusi atbilstoši tam. | 5a93617e |  |
| ivy-league.growth.note | Combed forward or to the side, works up to stage 3 (high hairline visible when brushed back). | Ķemmējot uz priekšu vai uz sāniem, piemērots līdz 3. stadijai (atglaužot atpakaļ, ir redzama augsta matu augšanas līnija). | d1ae6003 |  |
| ivy-league.density_note | Needs medium to thick density to hold a part. | Nepieciešami vidēji biezi vai biezi mati, lai noturētu celiņu. | 4ebbe219 |  |
| ivy-league.glasses_note | Works with almost any frame; round glasses give a collegiate look. | Piestāv gandrīz jebkuriem ietvariem; apaļas brilles piešķir akadēmisku koptēlu. | 724a2edd |  |
| ivy-league.upkeep.products.0 | light pomade | vieglas fiksācijas pomāde | ccc6c968 |  |
| ivy-league.upkeep.products.1 | water-based paste | pasta uz ūdens bāzes | 1207bbdf |  |
| ivy-league.grow_out | Easy to grow to a side-part flow. | Viegli ataudzēt līdz side-part flow griezumam. | 45778804 |  |
| ivy-league.client | A neat longer crew cut that can be brushed to the side or forward. The look is tidy and traditional. | Kopts, nedaudz garāks crew cut, ko var ķemmēt uz sānu vai uz priekšu. Tīrs un klasisks tēls. | b8606ee4 |  |
| ivy-league.stylist | Scissor-over-comb the sides; tapered neckline, top left 5-6 cm and point cut. Check the part is where the hair naturally falls. Neat taper into a rounded or natural neck. | Sānus griez ar šķērēm pāri ķemmei; veido pakāpenisku kakla līniju, augšdaļā atstāj 5–6 cm un iestrādā ar point cut. Pārliecinies, ka celiņš ir tur, kur mati krīt dabiski. Kārtīga pāreja uz noapaļotu vai dabisku kakla līniju. | 9c3423b9 |  |
| high-and-tight.name | High and tight | High and tight | 5c14e452 | same |
| high-and-tight.fade.note | Skin or #1 from the ears up to just above the temple; short block of hair left on top. | Līdz ādai vai #1 no ausīm līdz vietai virs deniņiem; augšpusē atstāta īsa matu josla. | 077e1874 |  |
| high-and-tight.sideburns | Removed or very short | Noskūti vai pavisam īsi | fa06e444 |  |
| high-and-tight.texture_fit.coily.note | Top block is 1-2 cm; moisten and brush down. | Augšdaļā mati ir 1–2 cm; samitrini un ar suku nogludini uz leju. | d40ab8e4 |  |
| high-and-tight.density_fit.low.note | Keep the top block at the longer end so it looks filled. | Augšējo matu joslu atstāj nedaudz garāku, lai tā izskatītos biezāka. | 16bd2f8b |  |
| high-and-tight.growth.whorl_note | Crown whorl visible on top if hair is longer than 1 cm. | Pakauša virpulis būs redzams, ja mati augšdaļā būs garāki par 1 cm. | 17496078 |  |
| high-and-tight.growth.note | Brings the eye up; a front hairline that is higher at the temples is clearly visible at stage 4 and above. | Vērš skatienu uz augšu; ja matu līnija deniņos ir augstāka, tā ir skaidri pamanāma no 4. stadijas. | a1ad4594 |  |
| high-and-tight.density_note | Needs enough density on top to look filled; thin hair looks sparse. | Augšdaļā nepieciešams pietiekams biezums, lai griezums izskatītos pilnīgs; plāni mati izskatīsies reti. | a326a46b |  |
| high-and-tight.glasses_note | Sides are bare, so frames read very prominently. | Sāni ir pavisam īsi, tāpēc briļļu ietvari īpaši izceļas. | 60318edc |  |
| high-and-tight.grow_out | Quick path to a crew cut in 4-5 weeks. | 4–5 nedēļu laikā ātri pārtop par crew cut. | 2880b483 |  |
| high-and-tight.client | Very short sides with a tight patch of hair on top. A strict, no-fuss look. | Pavisam īsi sāni un neliela, blīva matu josla augšpusē. Stingrs tēls bez liekām raizēm. | dde34a18 |  |
| high-and-tight.stylist | Use zero-gap at the lower area, then #1 and #2 climbing to the temple line. Keep the transition level and don't flatten the top. Tapered to skin or nearly skin. | Apakšējā zonā izmanto zero-gap, pēc tam #1 un #2 virzienā uz deniņu līniju. Saglabā pāreju vienā līmenī un nepieplacini augšdaļu. Pāreja līdz ādai vai gandrīz līdz ādai. | 28e272e6 |  |
| crew-messy-textured.name | Messy textured crew | Nevērīgs, teksturēts crew cut | adeccb0d |  |
| crew-messy-textured.fade.note | Clipper taper, #3 to #1. | Taper pāreja ar mašīnīti, no #3 līdz #1. | 94973868 |  |
| crew-messy-textured.sideburns | Short | Īsas | f5d61ead |  |
| crew-messy-textured.texture_fit.curly.note | Cut slightly longer on top (3-4 cm) so curls can lie forward. | Augšpusi atstāj nedaudz garāku (3–4 cm), lai cirtas kristu uz priekšu. | d96b0ac9 |  |
| crew-messy-textured.texture_fit.coily.note | Keep a short 2-3 cm top with a defined edge. | Augšpusē atstāj īsus matus (2–3 cm) ar izteiktu kontūru. | dda45761 |  |
| crew-messy-textured.growth.whorl_note | Choppy top disguises a thin crown. | Teksturēta, neregulāra augšdaļa noslēpj retākus matus pakausī. | 65df0697 |  |
| crew-messy-textured.growth.note | Choppy forward-pushed fringe softens stage 3-5 recession. | Uz priekšu vērsti, teksturēti priekšmati vizuāli mīkstina matu līnijas atkāpšanos 3.–5. stadijā. | 8855004b |  |
| crew-messy-textured.density_note | Fine to medium; texture adds visual density. | Smalkiem līdz vidēji bieziem matiem; tekstūra piešķir vizuālu biezumu. | c428c967 |  |
| crew-messy-textured.glasses_note | Sits well with most frames; keep hair above the ear short so the arms rest cleanly. | Labi sader ar lielāko daļu rāmju; virs ausīm matus atstāj īsus, lai briļļu kājiņas ērti piegultu. | 267e7433 |  |
| crew-messy-textured.upkeep.products.0 | matte clay | matēts māls | 37b1eb2f |  |
| crew-messy-textured.grow_out | Let it grow for 6-8 weeks and it becomes a longer textured crop. | Ļauj matiem paaugt 6–8 nedēļas, un griezums pārtaps par garāku, teksturētu crop. | 7942a7bc |  |
| crew-messy-textured.client | A short, textured crew cut with a forward top that falls over a hairline that is higher at the temples. | Īss, teksturēts crew cut ar uz priekšu veidotu augšpusi, kas piesedz augstāku matu līniju deniņos. | 0e70eb1c |  |
| crew-messy-textured.stylist | Point cut the front and top forward, avoid straight lines at the hairline and fade the sides lightly. | Priekšpusi un augšdaļu griez uz priekšu point cut tehnikā, izvairies no taisnām līnijām pie matu augšanas līnijas un sānos veido vieglu fade. | 48221282 |  |
| rounded-cap-crop.name | Rounded cap crop | Noapaļots cap crop | 3ef05a64 |  |
| rounded-cap-crop.texture_fit.curly.note | cut dry and let the curls shape the cap | griez sausos matos un ļauj cirtām pašām veidot cepurītes formu | 362c6ffc |  |
| rounded-cap-crop.texture_fit.coily.note | keep length on top for shrinkage | atstāj lielāku garumu augšpusē, ņemot vērā cirtu saraušanos | 276efbf1 |  |
| rounded-cap-crop.density_fit.high.note | thin the sides if very thick | samazini apjomu sānos, ja mati ir ļoti biezi | 2b5c386a |  |
| rounded-cap-crop.growth.note | The crown whorl needs a longer section or it may poke up. | Pakauša virpulī mati jāatstāj garāki, citādi tie var celties stāvus. | 9105ac83 |  |
| rounded-cap-crop.strand_note | Works with medium to fine strands; coarse strands are bulkier. | Piemērots vidēji bieziem līdz smalkiem matiem; raupjāki mati radīs lieku apjomu. | 3f0d0797 |  |
| rounded-cap-crop.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| rounded-cap-crop.upkeep.products.1 | texture spray | tekstūras sprejs | 9bf0ec6a |  |
| rounded-cap-crop.grow_out | As it grows the cap fills in at the nape and turns into a bixie, with no awkward stage. | Matiem ataugot, griezums kakla zonā piepildās un pārtop par bixie bez neveikla pārejas posma. | af1a9b43 |  |
| rounded-cap-crop.client | A neat, soft, rounded short cut that frames the face and stays tidy. | Kārtīgs, maigs un noapaļots īss griezums, kas ierāmē seju un saglabā koptu formu. | 1fedbb7d |  |
| rounded-cap-crop.stylist | Create a uniform curved shape from crown to ears using over-direction, then blend the nape with a short taper. Soften the perimeter by point cutting. Weight: round weight sits above the ears. | Izmantojot pārvirzīšanu (over-direction), izveido vienmērīgi noapaļotu formu no pakauša līdz ausīm, pēc tam kakla daļā savieno ar īsu pāreju (taper). Mīkstini perimetru point cut tehnikā. Apjoms: noapaļotā svara līnija atrodas virs ausīm. | 7454e575 |  |
| tapered-curly-crop-long-top.name | Tapered curly crop with longer top | Cirtains crop ar taper pāreju un garāku augšpusi | 5bf4bd9a |  |
| tapered-curly-crop-long-top.texture_fit.wavy.note | loose waves need more length on top | brīviem viļņiem augšpusē nepieciešams lielāks garums | 0d6ef5a2 |  |
| tapered-curly-crop-long-top.growth.note | The taper follows the nape and ear shape; a nape whorl may need a longer guard. | Pāreja seko kakla un ausu formai; ja kakla zonā ir virpulis, var būt nepieciešams garāks uzgalis. | 22593998 |  |
| tapered-curly-crop-long-top.strand_note | Works with all curl diameters; tight coils give height and loose curls give drape. | Piemērots jebkura diametra cirtām: sīkas cirtas veido augstumu, bet brīvākas – skaistu kritumu. | 642e0fc5 |  |
| tapered-curly-crop-long-top.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| tapered-curly-crop-long-top.upkeep.products.1 | curl-defining gel | želeja cirtu izcelšanai | c3f5576c |  |
| tapered-curly-crop-long-top.grow_out | The sides fill in and the cut grows into a curly bixie. | Sāni ataug, un griezums pārtop par cirtainu bixie. | 4744f347 |  |
| tapered-curly-crop-long-top.client | A cut with long curls on top and tight sides. | Griezums ar garām cirtām augšpusē un īsiem, pieguļošiem sāniem. | fe29c7f5 |  |
| tapered-curly-crop-long-top.stylist | Taper the sides and nape with clippers and keep the top 8-14 cm stretched so curls fall in their natural pattern. Weight: longer curls on top, tapered tight at the sides and nape. | Ar mašīnīti veido pāreju sānos un kakla zonā, bet augšdaļā atstāj 8–14 cm izstieptā veidā, lai cirtas kristu savā dabiskajā rakstā. Apjoms: garākas cirtas augšpusē, izteikta pāreja sānos un kakla zonā. | 82de6882 |  |
| curly-bowl-crop.name | Curly bowl crop | Cirtains bowl crop | f45f43d1 |  |
| curly-bowl-crop.texture_fit.wavy.note | waves need more length to form the cap | viļņainiem matiem nepieciešams lielāks garums, lai izveidotos cepurītes forma | 57d2d162 |  |
| curly-bowl-crop.density_fit.low.note | fine curls make a lighter cap, so avoid thinning | smalkas cirtas veido gaisīgāku formu, tāpēc izvairies no filēšanas | 38fcc279 |  |
| curly-bowl-crop.growth.note | The crown whorl affects the cap, so keep the length longer there. | Pakauša virpulis ietekmē griezuma formu, tāpēc šajā zonā atstāj lielāku garumu. | a439764f |  |
| curly-bowl-crop.strand_note | The cap needs enough curl density to hold a round outline. | Nepieciešams pietiekams cirtu biezums, lai griezums saglabātu apaļu kontūru. | 44e2d0ed |  |
| curly-bowl-crop.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-bowl-crop.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| curly-bowl-crop.grow_out | The cap grows into a curly bob as the sides lengthen, and only the fringe needs trimming in between. | Sāniem kļūstot garākiem, griezums pārtop par cirtainu bobu, un pa to laiku jāpielīdzina tikai priekšmati. | 1b6485bc |  |
| curly-bowl-crop.client | A round, short cap of curls with a short fringe. | Īss, apaļas formas cirtu griezums ar īsiem priekšmatiem. | dcc9742c |  |
| curly-bowl-crop.stylist | Cut dry in a circle from the crown, keeping the perimeter even and adding a short fringe. Weight: a rounded cap of curls, with weight sitting around the ears. | Griez sausus matus pa apli no pakauša, saglabājot vienmērīgu perimetru un izveidojot īsus priekšmatus. Apjoms: noapaļota cirtu "cepurīte", kur smaguma līnija atrodas ap ausīm. | 7eb24d2f |  |
| eton-crop.name | Eton crop | Eton crop | 86ba1dce | same |
| eton-crop.texture_fit.wavy.note | waves need gel to lie flat | viļņainiem matiem vajadzīga želeja, lai tie piegultu gludi | ea1e9008 |  |
| eton-crop.texture_fit.curly.note | see tapered-twa | skatīt tapered-twa | b0cc4a9f |  |
| eton-crop.texture_fit.coily.note | see tapered-twa | skatīt tapered-twa | b0cc4a9f |  |
| eton-crop.density_fit.high.note | thick hair stands off the head and needs closer tapering | biezi mati atstāv no galvas, tāpēc vajadzīga īsāka taper pāreja | 015735b7 |  |
| eton-crop.growth.note | A crown whorl or a cowlick makes slicking back difficult. | Pakauša virpulis vai nepaklausīga šķipsna apgrūtina matu atglaušanu. | aa88402b |  |
| eton-crop.strand_note | Fine to medium straight strands lie flat and give the sleek finish. | Smalki līdz vidēji biezi taisni mati labi pieguļ galvai un nodrošina gludu rezultātu. | 9e4d0767 |  |
| eton-crop.upkeep.products.0 | gel | želeja | cdc00f6c |  |
| eton-crop.upkeep.products.1 | pomade | pomāde | d3fe5b65 |  |
| eton-crop.grow_out | Grows out through a micro pixie stage and then a pixie, so expect about 8 weeks before it can be styled again. | Ataug caur micro pixie un pēc tam pixie posmu, tāpēc rēķinies ar aptuveni 8 nedēļām, pirms to atkal varēs ieveidot. | 63f8b22e |  |
| eton-crop.client | A very short, sleek crop that hugs the head and shows off the face. Classic and graphic. | Pavisam īss, gluds griezums, kas piekļaujas galvai un izceļ seju. Klasisks un grafisks. | f2bb2bec |  |
| eton-crop.stylist | Clipper-cut the sides and nape tight, scissor the top to 2-5 cm and comb back to set the shape. Weight: smooth, close to the head; no volume anywhere. | Ar mašīnīti īsi nogriez sānus un kakla daļu, ar šķērēm saīsini augšdaļu līdz 2–5 cm un atglaud uz aizmuguri, lai nofiksētu formu. Apjoms: gluds, cieši pie galvas; bez jebkāda apjoma. | 76194a0c |  |
| french-crop.name | French crop | French crop | f9c4e724 | same |
| french-crop.fade.note | Low taper, #3 down to #1, kept simple so the fringe is the focus. | Zema taper pāreja no #3 līdz #1; veidota vienkārša, lai uzmanības centrā paliktu priekšmati. | c974f2de |  |
| french-crop.sideburns | Short, tapered | Īsi, ar taper pāreju | b33481a3 |  |
| french-crop.texture_fit.wavy.note | Lift texture with clay and keep the top at 3-4 cm. | Izcel tekstūru ar mālu un atstāj augšdaļu 3–4 cm garumā. | d7827ce3 |  |
| french-crop.texture_fit.curly.note | Use a blunt-cut fringe at the shorter end to avoid hanging forward. | Griez priekšmatus taisni un īsāk, lai tie nekristu acīs. | 94f70cd6 |  |
| french-crop.texture_fit.coily.note | Shorten fringe to 2 cm and shape-up the line. | Saīsini priekšmatus līdz 2 cm un izveido skaidru kontūru. | 23639d1c |  |
| french-crop.density_fit.low.note | Keep the fringe short and textured; a heavy fringe looks sparse. | Priekšmatus atstāj īsus un teksturētus; smaga priekšmatu līnija izskatīsies reta. | 4a570d95 |  |
| french-crop.growth.whorl_note | Crown whorls are hidden; cowlicks at the hairline may need blow-dry. | Griezums noslēpj pakauša virpuļus; nepaklausīgas šķipsnas pie matu līnijas var nākties ieveidot ar fēnu. | 56a70d4d |  |
| french-crop.growth.note | One of the strongest options for a hairline that is higher at the temples or high overall, because the fringe covers it. | Viens no labākajiem variantiem, ja matu augšanas līnija ir augstāka deniņos vai kopumā augsta, jo priekšmati to piesedz. | 6642bef0 |  |
| french-crop.density_note | Medium to thick; needs enough density to hold a visible fringe. | Vidējiem līdz bieziem matiem; nepieciešams pietiekams biezums, lai izveidotu pamanāmus priekšmatus. | c51796bb |  |
| french-crop.glasses_note | The fringe should clear the top of the frames by 1 cm. | Priekšmatiem vajadzētu būt 1 cm virs briļļu ietvara augšdaļas. | 008360ca |  |
| french-crop.upkeep.products.0 | matte clay | matēts māls | 37b1eb2f |  |
| french-crop.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| french-crop.grow_out | Becomes a longer fringe crop at 8 weeks; keep fringe trimmed. | Pēc 8 nedēļām pārtop par crop ar garākiem priekšmatiem; pa to laiku regulāri pielīdzini priekšmatus. | 4e58d8d7 |  |
| french-crop.client | Short sides with a short, straight fringe brushed forward. Neat and very easy to live with. | Īsi sāni un īsi, taisni priekšmati, kas noķemmēti uz priekšu. Kārtīgs griezums, ko ikdienā ir ļoti viegli kopt. | 9593d27e |  |
| french-crop.stylist | Cut the fringe straight with scissors, then point-cut to break it. Back and sides tapered, no dramatic fade. Tapered or rounded. | Nogriez priekšmatus taisni ar šķērēm, pēc tam iestrādā point cut tehnikā, lai izjauktu stingro līniju. Aizmugurē un sānos veido pāreju (taper), bez krasa fade. Kakla līnija ar pakāpenisku pāreju vai noapaļota. | 2f4033ba |  |
| caesar-cut.name | Caesar cut | Cēzara griezums | 81f71d51 |  |
| caesar-cut.fade.note | Light taper; the line from fringe to sides is short and clean. | Viegla taper pāreja; līnija no priekšmatiem līdz sāniem ir īsa un tīra. | f990864d |  |
| caesar-cut.sideburns | Short | Īsas | f5d61ead |  |
| caesar-cut.texture_fit.curly.note | Use shorter fringe to prevent curls hanging in the eyes. | Izvēlies īsākus priekšmatus, lai cirtas nekristu acīs. | b2d2f318 |  |
| caesar-cut.texture_fit.coily.note | Short, flat or waved top with line-up works well. | Labi piestāv īsa, plakana vai viļņota augšpuse ar skaidri iezīmētu kontūru. | 7df5013f |  |
| caesar-cut.density_fit.low.note | Keep the fringe short and choppy so less scalp shows. | Priekšmatus griez īsus un robainus, lai galvas āda mazāk spīdētu cauri. | 277c9ea7 |  |
| caesar-cut.growth.note | Very good for stage 3-5; the straight horizontal fringe conceals a hairline that is higher at the temples. | Ļoti piemērots 3.–5. stadijai; taisni, horizontāli priekšmati noslēpj matu augšanas līniju, kas deniņos ir augstāka. | 2c8c0041 |  |
| caesar-cut.density_note | Needs medium to high density on top. | Augšdaļā nepieciešami vidēji vai biezi mati. | 685fbf7d |  |
| caesar-cut.glasses_note | Good with any frames. | Labi izskatās ar jebkuriem ietvariem. | 3e00f63e |  |
| caesar-cut.upkeep.products.0 | wax or light paste | vasks vai viegla pasta | 19161c3b |  |
| caesar-cut.grow_out | Grows into a French crop and then a longer textured fringe. | Pārtop par French crop un pēc tam par griezumu ar garākiem, teksturētiem priekšmatiem. | d91c6d77 |  |
| caesar-cut.client | A short, even top combed forward with a straight fringe. Neat, tidy and quick to style. | Vienmērīgi īsa, uz priekšu saķemmēta augšpuse ar taisniem priekšmatiem. Kopts, kārtīgs un ātri ieveidojams. | 8a5b988c |  |
| caesar-cut.stylist | Scissor-over-comb top to an even 2-3 cm, fringe cut straight just above the brow. Add light texturising if too heavy. Natural or lightly rounded. | Ar šķērēm pāri ķemmei nogriez augšdaļu vienmērīgos 2–3 cm, priekšmatus griez taisni tieši virs uzacīm. Ja tie šķiet par smagiem, viegli iestrādā tekstūru. Dabiska vai viegli noapaļota kakla līnija. | e15c81a4 |  |
| textured-crop-low-taper.name | Textured crop with low taper | Teksturēts crop ar zemu taper pāreju | 45630d51 |  |
| textured-crop-low-taper.fade.note | Low taper, #1 to #3; keeps weight above the ear. | Zema taper pāreja no #1 līdz #3; saglabā matu biezumu virs auss. | bce5a9be |  |
| textured-crop-low-taper.sideburns | Tapered | Ar taper pāreju | dcbacddd |  |
| textured-crop-low-taper.texture_fit.wavy.note | Texture builds itself; use less product. | Tekstūra veidojas pati; lieto mazāk veidošanas līdzekļa. | c3021da4 |  |
| textured-crop-low-taper.texture_fit.curly.note | Ask for a point-cut finish; leave 1 cm extra on top. | Palūdz griezumu point-cut tehnikā un atstāj augšpusē par 1 cm vairāk. | 8ccb2da4 |  |
| textured-crop-low-taper.texture_fit.coily.note | Shape-up the fringe line; works as a defined twist or sponge top. | Izveido precīzu priekšmatu līniju; lieliski piestāv savītām šķipsnām vai ieveidošanai ar sūklīti. | 4c7263bb |  |
| textured-crop-low-taper.density_fit.low.note | Use sea-salt spray and matte clay for grip and body. | Lieto jūras sāls spreju un matētu mālu fiksācijai un apjomam. | 9039ebb9 |  |
| textured-crop-low-taper.growth.whorl_note | Texture covers a thinning crown. | Tekstūra piesedz retākus matus pakausī. | 93bd86bf |  |
| textured-crop-low-taper.growth.note | Good: fringe covers temples; at stage 4 keep fringe at the longest end. | Laba izvēle: priekšmati piesedz deniņus; 4. stadijā atstāj priekšmatus maksimāli garus. | ce14ca85 |  |
| textured-crop-low-taper.density_note | Medium to thick; fine hair benefits from salt spray and a matte clay. | Vidējiem līdz bieziem matiem; smalkiem matiem noderēs sāls sprejs un matēts māls. | 3ebbd5d4 |  |
| textured-crop-low-taper.glasses_note | Fringe should clear the frame top. | Priekšmatiem vajadzētu beigties virs ietvara augšdaļas. | 3149f788 |  |
| textured-crop-low-taper.upkeep.products.0 | matte clay | matēts māls | 37b1eb2f |  |
| textured-crop-low-taper.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| textured-crop-low-taper.grow_out | Moves toward a textured quiff or flow in 8 weeks. | 8 nedēļu laikā pārtop par teksturētu quiff vai flow. | 84f85ab2 |  |
| textured-crop-low-taper.client | Short sides with a choppy, messy top pushed forward. Looks styled even when you don't try. | Īsi sāni un robaina, brīva augšpuse, kas vērsta uz priekšu. Izskatās ieveidots pat bez īpašām pūlēm. | 41759179 |  |
| textured-crop-low-taper.stylist | Clipper sides, scissor top with point cutting and razor texturising; leave the longest piece at the front. Blend with scissor-over-comb at the crown. | Sānus griez ar mašīnīti, augšdaļu ar šķērēm, izmantojot point cut un teksturēšanu ar bārdasnazi; visgarāko šķipsnu atstāj priekšpusē. Pakauša zonā savieno ar šķērēm pāri ķemmei. | c82e66b5 |  |
| textured-crop-mid-fade.name | Textured crop with mid fade | Teksturēts crop ar vidēju fade pāreju | 08fe1da3 |  |
| textured-crop-mid-fade.fade.note | Skin or #0.5 to #2 blend starting at the temple height. | Pāreja no pašas ādas (vai #0.5) līdz #2, sākot no deniņu augstuma. | 18aca5b0 |  |
| textured-crop-mid-fade.sideburns | Faded, lined optional | Ar fade pāreju, pēc izvēles ar iezīmētu kontūru | 6dae1c80 |  |
| textured-crop-mid-fade.texture_fit.curly.note | Leave 1 cm extra on top to account for spring-up. | Augšpusē atstāj par 1 cm vairāk, rēķinoties ar cirtu saraušanos. | 9ab66a98 |  |
| textured-crop-mid-fade.texture_fit.coily.note | Cut as a taper with a defined top; use curl cream. | Griez ar taper pāreju un izteiktu augšpusi; ieveido ar cirtu krēmu. | e1c7101e |  |
| textured-crop-mid-fade.density_fit.low.note | Ask for a taper instead of skin so the top does not look sparse against the sides. | Skin fade vietā izvēlies taper pāreju, lai augšpuse pret sāniem neizskatītos reta. | 2af3a179 |  |
| textured-crop-mid-fade.growth.note | Fringe covers temples at stage 3-4; mid fade keeps the sides neat. | Priekšmati piesedz deniņus 3.–4. stadijā; mid fade uztur sānus kārtīgus. | 4beb2581 |  |
| textured-crop-mid-fade.density_note | Medium to thick; thinning fine hair would show contrast. | Vidēji bieziem līdz bieziem matiem; ja smalki mati kļūst retāki, būs redzams kontrasts. | a29369a6 |  |
| textured-crop-mid-fade.glasses_note | Tight sides around the arms; leave 2-3 mm if frames are thick. | Īsi sāni ap briļļu kājiņām; ja ietvari ir biezi, atstāj 2–3 mm. | 7b18f2d3 |  |
| textured-crop-mid-fade.upkeep.products.0 | matte clay | matēts māls | 37b1eb2f |  |
| textured-crop-mid-fade.grow_out | Fade grows out to a taper by week 4. | Līdz 4. nedēļai fade pāreja ataug par taper. | 69a7b809 |  |
| textured-crop-mid-fade.client | A textured top that falls forward over sides faded from mid height. Modern and quick to style. | Teksturēta augšpuse, kas krīt uz priekšu, un sāni ar fade pāreju no vidēja augstuma. Moderns un ātri ieveidojams. | 0f693613 |  |
| textured-crop-mid-fade.stylist | Clip fade to skin or #0.5, then blend to #2. Scissor top and razor-texturise. Leave a short fringe with a lived-in line. Clean taper into the neckline. | Ar mašīnīti veido fade līdz ādai vai #0.5, tad savieno līdz #2. Augšdaļu griez ar šķērēm un teksturē ar bārdasnazi. Atstāj īsus priekšmatus ar dabisku, viegli nevērīgu līniju. Tīra pāreja uz kakla līniju. | 11a19a76 |  |
| top-heavy-fade.name | Top heavy fade | Top heavy fade | 6ea3995a | same |
| top-heavy-fade.fade.note | High skin fade with the top left long and disconnected. | Augsts skin fade ar garu, nesavienotu augšpusi. | febdd407 |  |
| top-heavy-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| top-heavy-fade.texture_fit.wavy.note | Volume comes naturally. | Apjoms veidojas dabiski. | 48325265 |  |
| top-heavy-fade.texture_fit.curly.note | Excellent; the curl length is the feature. | Lieliska izvēle – cirtu garums ir galvenais akcents. | 13b83cd1 |  |
| top-heavy-fade.texture_fit.coily.note | Works with a defined sponge or twist top. | Labi izskatās ar sponge vai twist tehnikā ieveidotu augšdaļu. | be1773dd |  |
| top-heavy-fade.density_fit.low.note | Keep the fade lower and the top textured; the volume on top is limited. | Veido zemāku fade pāreju un teksturē augšpusi, jo matu apjoms augšdaļā ir ierobežots. | be91a9c1 |  |
| top-heavy-fade.growth.whorl_note | Long top covers a thin crown moderately. | Garāka augšdaļa daļēji piesedz retākus matus pakausī. | 07558d44 |  |
| top-heavy-fade.growth.note | High fade exposes the temples; not advised past stage 3. | High fade atsedz deniņus; nav ieteicams pēc 3. stadijas. | 45544cbe |  |
| top-heavy-fade.density_note | Medium to thick; needs enough hair to show volume. | Vidēji bieziem līdz bieziem matiem; vajadzīgs pietiekams matu biezums, lai veidotos apjoms. | 66939a85 |  |
| top-heavy-fade.glasses_note | Tight fade opens the sides; frames show prominently. | Īss fade atsedz sānus, tāpēc briļļu ietvari ir labi pamanāmi. | e8931305 |  |
| top-heavy-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| top-heavy-fade.upkeep.products.1 | curl cream (curly) | krēms cirtām (cirtainiem matiem) | 563ac68d |  |
| top-heavy-fade.grow_out | Fade grows out to a taper in 3-4 weeks; keep top trimmed. | Fade pāreja 3–4 nedēļās ataug par taper; regulāri pielīdzini augšdaļu. | 2a570949 |  |
| top-heavy-fade.client | Sharp, tight sides with a lot of volume on top. A strong, modern look. | Precīzi, ļoti īsi sāni un izteikts apjoms augšpusē. Spēcīgs un mūsdienīgs tēls. | 7f906b44 |  |
| top-heavy-fade.stylist | Fade to skin, work from high to mid, preserve at least 6 cm on top. Blend the line cleanly by shaping the parietal ridge. Clean fade into the neck. | Veido fade līdz ādai virzienā no high uz mid, augšdaļā saglabājot vismaz 6 cm. Tīri savieno pārejas līniju, nostrādājot parietālo zonu (parietal ridge). Tīra fade pāreja uz kakla līniju. | 35e3f89f |  |
| perm-curls-men.name | Men's soft perm | Vieglie ilgviļņi vīriešiem | 9d69b08a |  |
| perm-curls-men.fade.note | Scissor-tapered sides under a permed top. | Ar šķērēm veidota taper pāreja sānos zem ilgviļņiem augšpusē. | 08bec228 |  |
| perm-curls-men.sideburns | Short | Īsas | f5d61ead |  |
| perm-curls-men.texture_fit.straight.note | Gives curl to straight hair. | Piešķir cirtas taisniem matiem. | d5df92e3 |  |
| perm-curls-men.texture_fit.curly.note | Your curls already give this shape; ask for the cut without the perm. | Tavas cirtas jau veido šādu formu; izvēlies tikai griezumu bez ilgviļņiem. | 16e0e242 |  |
| perm-curls-men.texture_fit.coily.note | Chemical straighten/perm risks breakage. | Ķīmiskā taisnošana vai ilgviļņi rada matu lūšanas risku. | 6ed3315b |  |
| perm-curls-men.density_fit.high.note | Remove bulk before the perm so the top does not turn wide. | Pirms ilgviļņiem noņem lieko biezumu, lai augšpuse nekļūtu par platu. | 124b9859 |  |
| perm-curls-men.growth.note | Curls add volume and cover recession. | Cirtas piešķir apjomu un piesedz atkāpušos matu līniju. | c167b7e9 |  |
| perm-curls-men.density_note | Any density; fine hair gets more body. | Jebkuram matu biezumam; smalki mati iegūst papildu apjomu. | 0d487219 |  |
| perm-curls-men.glasses_note | Curls may sit on the frame arms; trim the sides shorter. | Cirtas var krist uz briļļu kājiņām; apgriez sānus īsākus. | dd8955c7 |  |
| perm-curls-men.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| perm-curls-men.grow_out | Perm grows out over 4-6 months; cut the permed ends gradually. | Ilgviļņi ataug 4–6 mēnešu laikā; pakāpeniski apgriez ilgviļņu galus. | 954cfb49 |  |
| perm-curls-men.client | A soft permanent wave added to straight hair for body and curl. It grows out gradually. | Viegli ilgviļņi taisniem matiem apjomam un cirtām. Ataugot tie izlīdzinās pakāpeniski. | 58a2bb6e |  |
| perm-curls-men.stylist | Use large rods on top, test a strand, and cut after the perm is set. Aftercare cream helps curl hold. | Augšdaļā izmanto lielos ilgviļņu ruļļus, veic šķipsnas testu un griez tikai pēc tam, kad ilgviļņi ir nofiksējušies. Kopjošs krēms palīdz cirtām saglabāt formu. | 22ae8c50 |  |
| crown-sweep-even-top.name | Even-length short top (crown cover) | Vienmērīgi īsa augšpuse pakauša piesegšanai | b96e41b4 |  |
| crown-sweep-even-top.fade.note | Taper. | Taper pāreja. | 1d5526f3 |  |
| crown-sweep-even-top.sideburns | Short | Īsas | f5d61ead |  |
| crown-sweep-even-top.texture_fit.curly.note | Keep the top 3-4 cm so curls lie flat over the crown. | Augšpusi atstāj 3–4 cm garu, lai cirtas gludi nosegtu pakausi. | f916d8b2 |  |
| crown-sweep-even-top.texture_fit.coily.note | Keep the top 2-3 cm with a tidy taper. | Augšpusi atstāj 2–3 cm garu ar kārtīgu taper pāreju. | 44444250 |  |
| crown-sweep-even-top.density_fit.high.note | Thin the top with scissors so it lies flat and sweeps. | Izfilē augšpusi ar šķērēm, lai mati gludāk gultos uz sānu. | 26d993a3 |  |
| crown-sweep-even-top.growth.whorl_note | Keep the crown length the same as the rest of the top. | Saglabā pakauša garumu tādu pašu kā pārējai augšdaļai. | 2c7658d9 |  |
| crown-sweep-even-top.growth.note | Even top length leaves less contrast between thin and dense areas. | Vienmērīgs matu garums augšdaļā mazina kontrastu starp retākām un biezākām zonām. | 22841964 |  |
| crown-sweep-even-top.density_note | Thin or thinning hair, mostly at the crown. | Plāniem matiem vai matiem, kas kļūst retāki, īpaši pakausī. | b68c19f3 |  |
| crown-sweep-even-top.glasses_note | Sits well with most frames; keep hair above the ear short so the arms rest cleanly. | Labi sader ar lielāko daļu rāmju; virs ausīm matus atstāj īsus, lai briļļu kājiņas ērti piegultu. | 267e7433 |  |
| crown-sweep-even-top.upkeep.products.0 | matte paste | matēta pasta | 91424e12 |  |
| crown-sweep-even-top.grow_out | Grow the top for 8 weeks; the cut becomes a crew or Ivy base. | Ataudzē augšdaļu 8 nedēļas; griezums kļūst par bāzi crew cut vai Ivy League griezumam. | 45d99dfb |  |
| crown-sweep-even-top.client | A short, even top with a slight side sweep. Tidy and unfussy, and it suits thinning at the crown. | Vienmērīgi īsa augšpuse ar vieglu pārmetumu uz sānu. Kārtīgs un neprasīgs griezums, kas labi piestāv, ja mati pakausī kļūst retāki. | 92719ca1 |  |
| crown-sweep-even-top.stylist | Keep one even length over the crown and top, clipper-taper the sides and avoid long sections that would highlight thinning. | Saglabā vienmērīgu garumu virspusē un pakausī, sānos ar mašīnīti veido taper pāreju un izvairies no garākām šķipsnām, kas izceltu matu retumu. | 507aae3a |  |
| curly-fringe-forward.name | Curly forward crop | Cirtains crop ar priekšmatiem uz priekšu | b7348b39 |  |
| curly-fringe-forward.fade.note | Low taper under a forward-brushed curl fringe. | Zema taper pāreja zem uz priekšu ķemmētām cirtām. | cb9828e0 |  |
| curly-fringe-forward.sideburns | Tapered | Ar taper pāreju | dcbacddd |  |
| curly-fringe-forward.texture_fit.straight.note | Straight hair lacks the spring; use a French crop instead. | Taisniem matiem trūkst atsperīguma; tā vietā izvēlies French crop. | 93f80ef7 |  |
| curly-fringe-forward.texture_fit.wavy.note | Needs a diffuser to keep wave curl. | Vajadzīgs difuzors, lai saglabātu viļņainās cirtas. | 34c91646 |  |
| curly-fringe-forward.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-fringe-forward.texture_fit.coily.note | Short coils: shorten fringe to 3 cm and keep it moisturised. | Sīkām cirtām: saīsini priekšmatus līdz 3 cm un regulāri mitrini tos. | a3bc7908 |  |
| curly-fringe-forward.density_fit.low.note | Keep the curls shorter so they hold their spring. | Atstāj cirtas īsākas, lai tās saglabātu atsperīgumu. | 616b4d22 |  |
| curly-fringe-forward.growth.whorl_note | Curls cover the crown. | Cirtas nosedz pakausi. | b1cd2cd3 |  |
| curly-fringe-forward.growth.note | Forward curls cover temples and a high forehead well; one of the best for stage 3-5. | Uz priekšu vērstas cirtas labi nosedz deniņus un augstu pieri; viens no labākajiem variantiem 3.–5. stadijai. | 01e07d42 |  |
| curly-fringe-forward.density_note | Medium to thick; fine curls collapse. | Vidēji biezi līdz biezi mati; smalkas cirtas saplok. | 89d76780 |  |
| curly-fringe-forward.glasses_note | Keep the fringe clear of the top rim. | Priekšmatiem jābūt virs briļļu ietvara augšējās malas. | a0de1c8d |  |
| curly-fringe-forward.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-fringe-forward.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| curly-fringe-forward.grow_out | Fringe lengthens to a curly flow. | Priekšmati ataugot pārtop brīvi krītošās cirtās. | 3af07930 |  |
| curly-fringe-forward.client | Short sides with a curly fringe falling forward. Neat, relaxed and easy to style with cream. | Īsi sāni ar uz priekšu krītošiem cirtainiem priekšmatiem. Kopts, nepiespiests un viegli ieveidojams ar matu krēmu. | 3b123360 |  |
| curly-fringe-forward.stylist | Cut dry; shorten the fringe by 1 cm as curls spring up. Do not square the fringe; use a gently rounded edge. | Griez sausos matos; saīsini priekšmatus par 1 cm mazāk, jo cirtas sarausies un pacelsies. Neveido kantainu priekšmatu līniju, bet gan maigi noapaļotu malu. | 2802a731 |  |
| scissor-taper-classic.name | Classic scissor taper | Klasiskais šķēru taper | 5940a449 |  |
| scissor-taper-classic.fade.note | Scissor-over-comb taper at the ears and neck only; no skin. | Taper pāreja ar šķērēm pāri ķemmei tikai pie ausīm un kakla; bez pārejas līdz ādai. | 11b7820a |  |
| scissor-taper-classic.sideburns | Tapered, mid-ear length | Ar taper pāreju, līdz auss vidum | 2fdb3635 |  |
| scissor-taper-classic.texture_fit.curly.note | Stay on the longer end of the range so curls can drop. | Saglabā lielāku garumu, lai cirtas varētu brīvi izlocīties un krist. | 1e27ddd2 |  |
| scissor-taper-classic.texture_fit.coily.note | Use a comb and cut dry at 3-4 cm. | Izmanto ķemmi un griez sausus matus 3–4 cm garumā. | 97edad60 |  |
| scissor-taper-classic.growth.whorl_note | Cowlicks follow the natural fall. | Matu virpuļi seko dabiskajam kritumam. | b3146825 |  |
| scissor-taper-classic.growth.note | Neutral; a natural side part conceals mild recession. | Neitrāls griezums; dabiska sānu šķirtne nomaskē viegli atkāpušos matu līniju. | 7119e389 |  |
| scissor-taper-classic.density_note | Any; thin hair needs a bit more length on top. | Jebkuram matu biezumam; plāniem matiem virspusē vajadzīgs nedaudz lielāks garums. | 5c64e2d5 |  |
| scissor-taper-classic.glasses_note | Neat ears and sides leave frames clear. | Kārtīgi apstrādāti sāni un zona ap ausīm netraucē briļļu kājiņām. | ba54a890 |  |
| scissor-taper-classic.upkeep.products.0 | light pomade | vieglas fiksācijas pomāde | ccc6c968 |  |
| scissor-taper-classic.upkeep.products.1 | water-based gel | želeja uz ūdens bāzes | 2e57bf94 |  |
| scissor-taper-classic.grow_out | Easy to grow out into a side part. | Viegli ataug griezumā ar sānu šķirtni. | 29f03e47 |  |
| scissor-taper-classic.client | A traditional tidy cut: short around the ears and neck, enough length on top to part and comb. Soft finish. | Tradicionāls, kārtīgs griezums: īsi ap ausīm un kaklu, pietiekams garums augšpusē šķirtnei un saķemmēšanai. Dabisks, maigs nobeigums. | 401c962d |  |
| scissor-taper-classic.stylist | Hand-cut the sides with scissor-over-comb from #1-equivalent at the nape to about 2.5 cm; join to top with a vertical channel cut. Edge neckline lightly. Soft taper into natural neck. | Sānus griez ar šķērēm virs ķemmes no #1 uzgaļa ekvivalenta pie kakla līnijas līdz aptuveni 2,5 cm; savieno ar virspusi, veicot vertikālus iegriezumus (channel cut). Viegli iezīmē kakla līniju. Veido maigu taper pāreju dabiskajā kakla matu līnijā. | fcdc624d |  |
| low-taper-fade.name | Low taper fade | Low taper fade | 04750035 | same |
| low-taper-fade.fade.note | Begins just above the ear and nape; lengthens into a #2-#3 section. | Sākas tieši virs auss un kakla līnijas, pakāpeniski pārejot uz #2–#3 garumu. | d59b9f8e |  |
| low-taper-fade.sideburns | Tapered and lined | Ar taper pāreju un iezīmētu kontūru | e545591f |  |
| low-taper-fade.texture_fit.curly.note | Great for curls; preserves top volume. | Lieliski piemērots cirtām; saglabā apjomu virspusē. | 3ff7d210 |  |
| low-taper-fade.texture_fit.coily.note | Common for tight curls; defines the shape without a hard line. | Iecienīts sīki cirtainiem matiem; izceļ formu bez asas robežlīnijas. | 1d3ac88c |  |
| low-taper-fade.growth.note | Doesn't expose temples; works to stage 4 with a side part or fringe. | Neatsedz deniņus; piemērots līdz 4. stadijai, kombinējot ar sānu šķirtni vai priekšmatiem. | 47de0086 |  |
| low-taper-fade.density_note | Any; the neat low fade works for fine and thick alike. | Jebkuram matu biezumam; kārtīgs zems fade lieliski izskatās gan smalkiem, gan bieziem matiem. | 36cf0a91 |  |
| low-taper-fade.glasses_note | Fits any frames; fade is well below the arms. | Der jebkuriem ietvariem; fade līnija ir krietni zem briļļu kājiņām. | c56065d5 |  |
| low-taper-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| low-taper-fade.upkeep.products.1 | pomade | pomāde | d3fe5b65 |  |
| low-taper-fade.grow_out | Grows out to scissor taper quickly. | Ātri ataug klasiskā, ar šķērēm veidotā taper formā. | f903713a |  |
| low-taper-fade.client | Short around the ears and neck, blending smoothly into a longer top. Works for office and weekend. | Īsi ap ausīm un kaklu, plūstoši pārejot garākā augšdaļā. Piemērots gan birojam, gan brīvdienām. | 409e99c1 |  |
| low-taper-fade.stylist | Start fade at ear height with #0.5, blend up with #1, #2 and #3, slightly shorter at the nape. Use scissor-over-comb at the corners to avoid a line. | Sāc fade pāreju ausu augstumā ar #0.5 uzgali, pludini uz augšu ar #1, #2 un #3, pie kakla atstājot nedaudz īsāk. Pārejas stūros izmanto šķēres virs ķemmes, lai neveidotos asa līnija. | 79ebfa49 |  |
| mid-taper-fade.name | Mid taper fade | Mid taper fade | 7a51d1d2 | same |
| mid-taper-fade.fade.note | Begins at the middle of the side (eyebrow height) and keeps some length. | Sākas sānu vidusdaļā (uzacu augstumā) un saglabā nelielu garumu. | ea759080 |  |
| mid-taper-fade.sideburns | Tapered | Ar taper pāreju | dcbacddd |  |
| mid-taper-fade.growth.note | Ok to stage 4 when top is long enough to sweep to the side. | Piemērots līdz 4. stadijai, ja virspusē ir pietiekams garums, ko ieveidot uz sānu. | 37fbacf9 |  |
| mid-taper-fade.density_note | Any density works; the clipper blend is gentler than a skin fade, so fine hair does not look see-through. | Piemērots jebkuram matu biezumam; pāreja ar mašīnīti ir maigāka nekā skin fade, tāpēc smalki mati neizskatās caurspīdīgi. | a964b0d9 |  |
| mid-taper-fade.glasses_note | Keep blend above the temple tips to prevent a hard line near the glasses arm. | Veido pāreju virs deniņu galiem, lai pie briļļu kājiņas neveidotos asa līnija. | 99d51a7c |  |
| mid-taper-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| mid-taper-fade.upkeep.products.1 | pomade | pomāde | d3fe5b65 |  |
| mid-taper-fade.grow_out | Eased into a taper by week 4. | Līdz 4. nedēļai vienmērīgi pārtop klasiskā taper formā. | 65581b30 |  |
| mid-taper-fade.client | Shorter on the sides with a clear fade, a little more modern than a low taper. | Īsāki sāni ar izteiktu fade pāreju – nedaudz modernāks nekā low taper. | 33a644ec |  |
| mid-taper-fade.stylist | Start the blend at about 3 cm above the ear. Lever the clipper outwards to avoid a ridge; refine with trimmers around the ear. | Sāc pāreju aptuveni 3 cm virs auss. Virzi mašīnīti uz āru, lai neveidotos kante; ap ausīm pielīdzini ar trimmeri. | 8c3becea |  |
| low-skin-fade.name | Low skin fade | Low skin fade | 3a2ec438 | same |
| low-skin-fade.fade.note | Skin at the ear and nape, rising to #2 about 3-4 cm up. | Līdz ādai pie auss un kakla līnijas, apmēram 3–4 cm augstāk pārejot uz #2. | 993e3dab |  |
| low-skin-fade.sideburns | Faded to skin | Izpludinātas līdz ādai | 3ee550d5 |  |
| low-skin-fade.texture_fit.curly.note | Curls stay put above the fade line. | Cirtas saglabā formu virs fade līnijas. | 8a0039af |  |
| low-skin-fade.texture_fit.coily.note | Strong contrast; ask for a line-up. | Izteikts kontrasts; palūdz meistaram iezīmēt matu augšanas līniju (line-up). | f13e058d |  |
| low-skin-fade.growth.whorl_note | Crown thinning is unaffected. | Neietekmē matu retumu pakausī. | 1c79dc47 |  |
| low-skin-fade.growth.note | Doesn't expose the temples; works from stage 3-5. | Neatsedz deniņus; piemērots 3.–5. stadijai. | 1105b558 |  |
| low-skin-fade.density_note | Any; fine hair shows scalp at the fade, which looks fine to most. | Jebkuram matu biezumam; smalkiem matiem fade pārejā būs redzama galvas āda, taču vairumam tas izskatās labi. | 4e2e936d |  |
| low-skin-fade.glasses_note | Close-faded sides: ensure arms sit comfortably. | Ļoti īsi noskūti sāni: pārliecinies, ka briļļu kājiņas pieguļ ērti. | ff940319 |  |
| low-skin-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| low-skin-fade.upkeep.products.1 | pomade | pomāde | d3fe5b65 |  |
| low-skin-fade.grow_out | Takes 3-4 weeks to grow into a taper. | 3–4 nedēļu laikā pārtop taper griezumā. | 14bec904 |  |
| low-skin-fade.client | Very short around the ears and neck, fading to skin; top left long enough to style. | Ļoti īsi ap ausīm un kaklu ar fade pāreju līdz ādai; augšdaļa atstāta pietiekami gara ieveidošanai. | 4140bb9d |  |
| low-skin-fade.stylist | Zero-gap blade at the base, flicking up through #0.5, #1 and #2. Check the symmetry with comb over the ear line. Skin-faded neckline. | Pie pamatnes izmanto zero-gap asmeni, veidojot pāreju uz augšu ar #0.5, #1 un #2 uzgaļiem. Pārbaudi simetriju ar ķemmi virs auss līnijas. Kakla līniju noformē ar skin fade līdz ādai. | 88fc2634 |  |
| mid-skin-fade.name | Mid skin fade | Mid skin fade | 2a694faf | same |
| mid-skin-fade.fade.note | Skin at the base, mid-temple height start. | Pāreja sākas no pašas ādas deniņu vidus augstumā. | 47f23874 |  |
| mid-skin-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| mid-skin-fade.growth.note | Good to stage 4; fringe or sweep keeps the temples covered. | Piemērots līdz 4. stadijai; priekšmati vai uz sānu ieveidoti mati nosedz deniņus. | 32de3e8f |  |
| mid-skin-fade.density_note | Any density; fine or thin hair on the sides shows slightly more scalp than coarse hair. | Jebkurš matu biezums; smalkiem vai plāniem matiem sānos galvas āda spīdēs cauri nedaudz vairāk nekā rupjiem matiem. | ff3c9e22 |  |
| mid-skin-fade.glasses_note | OK; trim around the arm for comfort. | Viss kārtībā; pie briļļu kājiņām piegriez rūpīgi, lai valkāšana būtu ērta. | 4b00a77b |  |
| mid-skin-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| mid-skin-fade.upkeep.products.1 | pomade | pomāde | d3fe5b65 |  |
| mid-skin-fade.grow_out | Grows to mid taper in 3 weeks. | 3 nedēļu laikā pārtop vidējā taper griezumā. | 8c17793e |  |
| mid-skin-fade.client | Medium-height fade down to skin that suits most tops. Clean and sharp. | Vidēja augstuma fade līdz ādai, kas piestāv lielākajai daļai griezumu augšpusē. Kopts un precīzs. | daa36020 |  |
| mid-skin-fade.stylist | Skin fade to #1.5 then to #3 near the parietal. Keep the blend line even, 90 degrees to the head. | Veido skin fade līdz #1.5 un tad līdz #3 uzgalim pie parietālās zonas. Saglabā vienmērīgu pārejas līniju 90 grādu leņķī pret galvu. | bcee6a84 |  |
| high-skin-fade.name | High skin fade | High skin fade | ab41e065 | same |
| high-skin-fade.fade.note | Skin to #2 from the ears up to about the temple. | Pāreja no ādas līdz #2 no ausīm uz augšu līdz pat deniņiem. | 30b07552 |  |
| high-skin-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| high-skin-fade.texture_fit.curly.note | Creates a strong contrast with curls. | Veido izteiksmīgu kontrastu ar cirtām. | 4bcf1cfb |  |
| high-skin-fade.texture_fit.coily.note | Strong with high top or twists. | Izteiksmīgs salikumā ar high-top vai tvistiem. | 59559572 |  |
| high-skin-fade.density_fit.low.note | The bare sides draw the eye to the top; keep the top textured or choose a mid fade. | Sāni līdz ādai pievērš uzmanību augšdaļai; veido to teksturētu vai izvēlies mid fade. | 83d0b3d1 |  |
| high-skin-fade.growth.note | Exposes temples; not recommended beyond stage 3. | Atsedz deniņus; nav ieteicams pēc 3. stadijas. | 57cfa049 |  |
| high-skin-fade.density_note | Needs medium to thick density on top, because the bare sides draw the eye to the top mass. | Virspusē nepieciešami vidēji vai biezi mati, jo noskūtie sāni piesaista uzmanību apjomam augšdaļā. | f8ddbbaa |  |
| high-skin-fade.glasses_note | Frames visible; sides bare. | Rāmji ir labi redzami; sāni ir pilnībā atsegti. | 0b5b0a76 |  |
| high-skin-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| high-skin-fade.upkeep.products.1 | pomade | pomāde | d3fe5b65 |  |
| high-skin-fade.grow_out | A week-4 high fade becomes a mid taper. | Pēc 4 nedēļām augstais fade pārtop vidējā taper griezumā. | 9ed4098b |  |
| high-skin-fade.client | Sides are very short and rise high on the head; leaves the top long and noticeable. | Sāni ir ļoti īsi un pāreja sniedzas augstu; augšdaļa atstāta gara un pamanāma. | 0512d32c |  |
| high-skin-fade.stylist | Fade starts at the temple or just above, skin base to #2. Blend with trimmers around the temple, use the clipper over comb on the corners. | Fade sākas pie deniņiem vai nedaudz virs tiem, no ādas līdz #2 uzgalim. Sapludini ar trimmeri ap deniņiem, stūros izmanto mašīnīti virs ķemmes. | f79c7d05 |  |
| drop-fade.name | Drop fade | Drop fade | 6c602017 | same |
| drop-fade.fade.note | Fade line starts high at the temple and drops in an arc behind the ear to the nape. | Fade līnija sākas augstu pie deniņiem un lokveidā nolaižas aiz auss līdz kakla līnijai. | b409df49 |  |
| drop-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| drop-fade.texture_fit.curly.note | Beautiful with curls; frames the back of the head. | Lieliski izskatās ar cirtām; skaisti ierāmē pakauša līniju. | 1bcef323 |  |
| drop-fade.texture_fit.coily.note | Flatters rounded heads. | Lieliski piestāv apaļākai galvas formai. | 5e04ac5d |  |
| drop-fade.growth.whorl_note | Check that the drop doesn't cross the crown. | Pārliecinies, ka fade līnija nešķērso pakauša virpuli. | b13557c2 |  |
| drop-fade.growth.note | Hairline is less exposed than a high fade; ok to stage 4. | Matu augšanas līnija ir mazāk atsegta nekā ar high fade; piemērots līdz 4. stadijai. | 74138fe9 |  |
| drop-fade.density_note | Any density; the arc is easier to read on thick hair, but fine hair also works. | Jebkurš matu biezums; lokveida līnija izteiktāk redzama biezos matos, taču labi izskatās arī smalkos. | f7d4f3f4 |  |
| drop-fade.glasses_note | Arm sits where the fade drops; check comfort. | Briļļu kājiņa atrodas vietā, kur fade līnija pazeminās; pārbaudi, vai tā pieguļ ērti. | b64da991 |  |
| drop-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| drop-fade.upkeep.products.1 | pomade | pomāde | d3fe5b65 |  |
| drop-fade.grow_out | Fades into a taper at 3-4 weeks. | Pēc 3–4 nedēļām pārtop taper griezumā. | 876b4f6a |  |
| drop-fade.client | A short textured top with sides that fade to the skin and curve down behind the ear. | Īsa, teksturēta augšdaļa un sāni ar fade pāreju līdz ādai, kas lokā nolaižas aiz auss. | 5fb48114 |  |
| drop-fade.stylist | Draw an arc from the temple behind the ear to the nape, blend through #0.5 to #3. Keep the outer edge cleaner than the top. Curved neckline follows the drop. | Iezīmē loku no deniņiem aiz auss līdz kaklam, veidojot pāreju no #0.5 līdz #3 uzgalim. Ārējo malu veido tīrāku un precīzāku par virspusi. Kakla līnijas izliekums seko lejupejošajam fade. | 2b64f460 |  |
| burst-fade.name | Burst fade | Burst fade | 54393c40 | same |
| burst-fade.fade.note | Fade curves in a half circle around the ear; back stays longer. | Fade pāreja veido pusloku ap ausi; aizmugurē mati paliek garāki. | afdb0103 |  |
| burst-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| burst-fade.texture_fit.coily.note | Frames the shape of the ear. | Skaisti ierāmē auss formu. | 4f5fc696 |  |
| burst-fade.density_fit.low.note | Keep the back fuller and the top textured so neither looks sparse. | Atstāj aizmuguri biezāku un augšdaļu teksturētu, lai mati neizskatītos pārāk reti. | 126b9446 |  |
| burst-fade.growth.note | Hairline at the temple is faded; ok to stage 4. | Matu augšanas līnija pie deniņiem ir noēnota; piemērots līdz 4. stadijai. | 1c2ee6da |  |
| burst-fade.density_note | Medium to thick; fine hair looks sparse. | Vidēji līdz biezi mati; smalki mati izskatīsies pārāk reti. | 2d61fe9d |  |
| burst-fade.glasses_note | The curve sits near the arm; keep tidy. | Pārejas izliekums atrodas tuvu briļļu kājiņai; uzturi šo zonu kārtīgu. | 6480a343 |  |
| burst-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| burst-fade.upkeep.products.1 | pomade | pomāde | d3fe5b65 |  |
| burst-fade.grow_out | Back length stays even; fade needs touch ups every 3 weeks. | Aizmugurē garums saglabājas vienmērīgs; fade ieteicams atjaunot ik pēc 3 nedēļām. | 863c6b9c |  |
| burst-fade.client | A rounded fade around the ear while the back is left longer. A modern look often worn with a mullet. | Noapaļota fade pāreja ap ausi, saglabājot garākus matus aizmugurē. Mūsdienīgs tēls, ko bieži kombinē ar mullet. | cea75364 |  |
| burst-fade.stylist | Use a #0.5 at the outer ring and widen the radius with #1 and #2. Keep the back length at least 2 cm. Back of the head is not faded; only a tidy outline. | Ārējā lokā izmanto #0.5 uzgali un paplašini rādiusu ar #1 un #2. Aizmugurē saglabā vismaz 2 cm garumu. Galvas aizmugurējā daļā fade neveido – tikai izveido kārtīgu kontūru. | 3ff87e13 |  |
| temple-fade.name | Temple fade | Temple fade | 70e5e39b | same |
| temple-fade.fade.note | Fade confined to the sideburns and temple; the rest keeps length. | Fade pāreja veidota tikai pie deniņiem un bakenbardēm; pārējā daļā saglabāts garums. | b80b7ebb |  |
| temple-fade.sideburns | Faded to skin or #1 | Ar fade pāreju līdz ādai vai #1 | e32f8e94 |  |
| temple-fade.texture_fit.coily.note | Often paired with a shape-up and short natural top. | Bieži tiek kombinēts ar precīzu līniju (shape-up) un īsiem, dabiskiem matiem virspusē. | 84472911 |  |
| temple-fade.growth.note | Brings emphasis to the temple area; not advised if temples recede beyond stage 2. | Vērš uzmanību uz deniņu zonu; nav ieteicams, ja deniņu līnija atkāpusies tālāk par 2. stadiju. | c2939efe |  |
| temple-fade.density_note | Any density; the fade is small, so the difference between thin and thick hair is minor. | Jebkurš matu biezums; fade zona ir maza, tāpēc atšķirība starp plāniem un bieziem matiem ir minimāla. | e5bf7501 |  |
| temple-fade.glasses_note | Check sideburn length vs the frame arm. | Pārbaudi vaigubārdas garumu attiecībā pret briļļu kājiņu. | c2c9ed49 |  |
| temple-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| temple-fade.grow_out | No growing needed: the rest of the head keeps its length, and the temple blend softens in about 3 weeks. | Ataudzēšana nav vajadzīga: pārējie mati saglabā garumu, un pāreja pie deniņiem kļūst maigāka aptuveni 3 nedēļu laikā. | 2a7ab7ff |  |
| temple-fade.client | A neat fade only at the temples and sideburns so the cut stays longer elsewhere. | Kārtīga fade pāreja tikai pie deniņiem un bakenbardēm, ļaujot matiem citviet palikt garākiem. | b10c38c1 |  |
| temple-fade.stylist | Fade about 3 cm up from the sideburn with trimmer or clipper. Square the edges lightly; no hard line at the nape. Back tidy but not faded. | Veido fade pāreju aptuveni 3 cm uz augšu no vaigubārdas ar trimmeri vai mašīnīti. Viegli iezīmē taisnas kontūras; pie kakla neveido asu līniju. Aizmuguri noformē kārtīgi, bet bez fade. | 03285d7a |  |
| shadow-fade.name | Shadow fade | Shadow fade | 804db32f | same |
| shadow-fade.fade.note | Like a skin fade but leaves a light stubble (1 mm) at the base. | Līdzīgs skin fade, taču pašā apakšā atstāj vieglus rugājus (1 mm). | 770bd9d2 |  |
| shadow-fade.sideburns | Faded softly | Ar maigu fade pāreju | ad9d7fb4 |  |
| shadow-fade.texture_fit.coily.note | Very good at keeping the scalp from showing. | Lieliski palīdz, lai galvas āda nespīdētu cauri. | ec0bc98b |  |
| shadow-fade.growth.note | Soft fade blends into the temples; ok to stage 5. | Maiga fade pāreja saplūst ar deniņiem; piemērots līdz pat 5. stadijai. | da2a45cb |  |
| shadow-fade.density_note | Any; thin hair more forgiving than a skin fade. | Jebkurš; plāniem matiem daudz pateicīgāks nekā skin fade. | 1dfe4a6c |  |
| shadow-fade.glasses_note | Fine; soft base never leaves a hard skin line around the arms. | Lieliski piemērots; maigā pamatne pie briļļu kājiņām neatstāj asu ādas līniju. | b9c935d6 |  |
| shadow-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| shadow-fade.grow_out | Grows out gently without a visible edge. | Ataug vienmērīgi un bez pamanāmas robežlīnijas. | 4f62f75c |  |
| shadow-fade.client | A fade that stays a little fuzzy rather than going to bare skin. Soft but neat. | Fade pāreja, kas nesniedzas pavisam līdz ādai, bet atstāj vieglu matu ēnojumu. Maigs, bet kopts griezums. | b3566a45 |  |
| shadow-fade.stylist | Start at #0.5, blend in a quarter-turn; do not use zero-gap. Check evenness with the comb. | Sāc ar #0.5 uzgali, veidojot pāreju ar kustību uz āru; neizmanto zero-gap asmeni. Pārbaudi vienmērīgumu ar ķemmi. | 1ae190fb |  |
| curly-taper-defined.name | Taper with defined curls | Taper ar izteiktām cirtām | 287210a5 |  |
| curly-taper-defined.fade.note | Low taper that shortens only the sideburns, ears and nape; the curl mass stays intact above. | Low taper pāreja, kas saīsina matus tikai pie bakenbardēm, ausīm un kakla; cirtu masa augšpusē paliek neskarta. | 43a8d1c9 |  |
| curly-taper-defined.sideburns | Tapered, lined optional | Ar taper pāreju, kontūra pēc izvēles | d899a1dd |  |
| curly-taper-defined.texture_fit.straight.note | Straight hair will not hold curl definition; choose a textured crop. | Taisni mati neturēs cirtu formu; izvēlies teksturētu crop. | 9dfef83b |  |
| curly-taper-defined.texture_fit.wavy.note | Loose waves form soft curls at 7+ cm; use cream and a diffuser. | Viegli viļņaini mati no 7+ cm garuma veido mīkstas cirtas; lieto krēmu un difuzoru. | 2026ae36 |  |
| curly-taper-defined.texture_fit.curly.note | Core design: cut dry so curl spring is visible. | Pamatvariants: griez sausos matos, lai uzreiz redzētu cirtu atsperīgumu. | 719d96a0 |  |
| curly-taper-defined.texture_fit.coily.note | Works at 5-7 cm with twist-out or sponge definition; moisturise. | Lieliski izskatās 5–7 cm garumā, ieveidojot ar twist-out tehniku vai sūkli; neaizmirsti mitrināt matus. | b61f5196 |  |
| curly-taper-defined.density_fit.low.note | Use a volumising curl product and keep the top at the shorter end. | Lieto kuplinošu līdzekli cirtām un atstāj augšdaļu nedaudz īsāku. | a0f9cc9c |  |
| curly-taper-defined.growth.whorl_note | A crown whorl makes curls swirl; leave 1 cm extra length there. | Pakauša virpulis liek cirtām griezties; atstāj tur par 1 cm lielāku garumu. | d39be024 |  |
| curly-taper-defined.growth.note | Curl volume sits forward and can cover stage 3-4 temples; keep length on the front and avoid a hard line-up. | Cirtu apjoms ir vērsts uz priekšu un var nosegt deniņus 3.–4. stadijā; saglabā garumu priekšpusē un izvairies no asas matu līnijas (line-up). | a26fc56a |  |
| curly-taper-defined.density_note | Medium to thick works best; fine, low-density curls look flat without volume product. | Vispiemērotākie ir vidēji līdz biezi mati; smalkas un retākas cirtas bez apjoma līdzekļa izskatīsies pieplakušas. | c0f76afc |  |
| curly-taper-defined.glasses_note | Tapered sides leave the arms clear; curls above the ear can lift frames, so thin the area. | Taper pāreja sānos atbrīvo vietu briļļu kājiņām; cirtas virs auss var pacelt rāmi, tāpēc šo zonu ieteicams izfilēt. | 3a6575d7 |  |
| curly-taper-defined.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-taper-defined.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| curly-taper-defined.grow_out | Moves to a curly flow in 8-10 weeks. | 8–10 nedēļu laikā ataug brīvi krītošās cirtās. | a43922a0 |  |
| curly-taper-defined.client | Short around the ears and neck while the top keeps its natural curls. Defined and easy to maintain. | Īsi ap ausīm un kaklu, augšdaļā saglabājot dabiskās cirtas. Izteiksmīgs un viegli kopjams griezums. | 3f14a717 |  |
| curly-taper-defined.stylist | Cut the top dry curl-by-curl, leaving 5-9 cm; clipper taper with #1-#3 at the sides. Avoid razor on tight curls; blend the outline with scissors. Soft taper into a natural or lightly rounded neckline. | Griez virspusi sausos matos šķipsnu pa šķipsnai, atstājot 5–9 cm garumu; sānos veido taper pāreju ar mašīnīti (#1–#3). Izteiktām cirtām neizmanto bārdasnazi; kontūru sapludini ar šķērēm. Veido maigu taper pāreju dabiskā vai viegli noapaļotā kakla līnijā. | 230a76b7 |  |
| curly-skin-fade-top.name | Curly top with mid skin fade | Mid skin fade ar cirtainu augšdaļu | 04f2a089 |  |
| curly-skin-fade-top.fade.note | Skin at the base, rising to #2 at about eyebrow height. | Pāreja sākas no pašas ādas, apmēram uzacu augstumā sasniedzot #2. | 3aae49ce |  |
| curly-skin-fade-top.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| curly-skin-fade-top.texture_fit.straight.note | Straight hair will not curl on top; choose a textured crop. | Taisni mati augšpusē necirtosies; tā vietā izvēlies teksturētu crop. | 4b963869 |  |
| curly-skin-fade-top.texture_fit.wavy.note | Waves of 7+ cm form soft curls. | Viļņaini mati no 7+ cm garuma veido mīkstas cirtas. | 52f120cd |  |
| curly-skin-fade-top.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-skin-fade-top.texture_fit.coily.note | Core design; high contrast on tight coils. | Pamatvariants; izteiksmīgs kontrasts uz sīkām cirtiņām. | cc182426 |  |
| curly-skin-fade-top.density_fit.low.note | Ask for a taper instead of skin so the top looks fuller. | Skin fade vietā palūdz taper pāreju, lai augšdaļa izskatītos biezāka. | 139979fb |  |
| curly-skin-fade-top.growth.note | Mid fade keeps the temples; curls fall forward to cover stage 3-4. | Vidējais fade saglabā matus pie deniņiem; cirtas krīt uz priekšu un nosedz 3.–4. stadiju. | da3b4b5f |  |
| curly-skin-fade-top.density_note | Medium to thick; strong contrast reveals thin spots on top. | Vidēji līdz biezi mati; izteiktais kontrasts izceļ retākas vietas virspusē. | 47825ef4 |  |
| curly-skin-fade-top.glasses_note | Tight sides; glasses frames show clearly. | Ļoti īsi sāni; briļļu rāmji ir skaidri redzami. | 436ceca0 |  |
| curly-skin-fade-top.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-skin-fade-top.upkeep.products.1 | gel | želeja | cdc00f6c |  |
| curly-skin-fade-top.grow_out | Fade becomes a taper at week 4. | Pēc 4 nedēļām fade pārtop par taper. | 9cc9d16d |  |
| curly-skin-fade-top.client | Very short sides faded to skin and a curly top. Sharp, modern and quick to style. | Ļoti īsi sāni ar fade pāreju līdz ādai un cirtaina augšdaļa. Izteiksmīgs, moderns un ātri ieveidojams. | 5a87f4c1 |  |
| curly-skin-fade-top.stylist | Skin to #2 fade; do the top dry. Leave 8 cm on top; leave a tiny weight line to help curl clumps. | Veido fade no ādas līdz #2 uzgalim; augšdaļu griez sausos matos. Augšā atstāj 8 cm un saglabā nelielu svara līniju, kas palīdz cirtām sagrupēties šķipsnās. | 692b6a7a |  |
| curly-drop-fade.name | Curly drop fade | Cirtainais drop fade | 961d4515 |  |
| curly-drop-fade.fade.note | The fade arcs behind the ear and drops to the nape, with curls untouched above. | Fade pāreja lokā apiet aiz auss un nolaižas līdz kaklam, atstājot cirtas augšpusē neskartas. | f713b718 |  |
| curly-drop-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| curly-drop-fade.texture_fit.straight.note | Not suited: use a regular drop fade with a textured top instead. | Nav piemērots: tā vietā izvēlies klasisko drop fade ar teksturētu augšdaļu. | 4da581e4 |  |
| curly-drop-fade.texture_fit.wavy.note | Waves at 7 cm form soft curls. | Viļņaini mati 7 cm garumā veido mīkstas cirtas. | 23d69b0f |  |
| curly-drop-fade.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-drop-fade.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-drop-fade.density_fit.low.note | Keep the curls shorter and use a light mousse for volume. | Atstāj cirtas īsākas un apjomam izmanto vieglas putas. | 94aa96df |  |
| curly-drop-fade.growth.note | Hairline untouched; curls cover stage 3-4. | Matu augšanas līnija paliek neskarta; cirtas nosedz 3.–4. stadiju. | 6fd90186 |  |
| curly-drop-fade.density_note | Medium to thick; fine curls lose volume at the top. | Vidējiem līdz bieziem matiem; smalkas cirtas augšpusē zaudē apjomu. | f070d396 |  |
| curly-drop-fade.glasses_note | Check comfort at the arm. | Pārliecinies, vai briļļu kājiņa nespiež. | de4eed18 |  |
| curly-drop-fade.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-drop-fade.grow_out | Fades into a taper in 3-4 weeks. | 3–4 nedēļu laikā fade pāraug par taper. | 5a4446de |  |
| curly-drop-fade.client | Natural curls on top with a fade that curves down behind the ear to the neck. | Dabiskas cirtas augšpusē un fade pāreja, kas liektā līnijā nolaižas aiz auss līdz kaklam. | bcb85911 |  |
| curly-drop-fade.stylist | Draw an arc from the temple behind the ear to the nape, blending through #1.5 and #2. Keep the curl clumps unclipped. Curved neckline. | Veido loku no deniņiem aiz auss līdz kaklam, sapludinot ar #1.5 un #2. Cirtu šķipsnas atstāj neskartas. Noapaļota kakla līnija. | 231a3f31 |  |
| curly-burst-fade.name | Curly burst fade | Cirtainais burst fade | d5efb732 |  |
| curly-burst-fade.fade.note | Fade curves around the ear while the back stays longer. | Fade pāreja veido loku ap ausi, kamēr aizmugurē mati paliek garāki. | 04668749 |  |
| curly-burst-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| curly-burst-fade.texture_fit.straight.note | Not suited: use a straight-hair textured crop with burst fade. | Nav piemērots: taisniem matiem labāk izvēlies teksturētu crop ar burst fade. | eb16af55 |  |
| curly-burst-fade.texture_fit.wavy.note | Waves form soft curls. | Viļņaini mati veido mīkstas cirtas. | 3e398031 |  |
| curly-burst-fade.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-burst-fade.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-burst-fade.density_fit.low.note | Keep the burst small and the curls compact. | Izvēlies nelielu burst fade laukumu un veido cirtas kompaktākas. | 01f3f66f |  |
| curly-burst-fade.growth.note | Fine for stage 3-4, the curls cover the temples. | Labi der 3.–4. stadijai, jo cirtas nosedz deniņus. | c743c446 |  |
| curly-burst-fade.density_note | Medium to thick density; fine curls look sparse over a fade. | Vidējiem līdz bieziem matiem; smalkas cirtas virs fade izskatās retas. | 32751e13 |  |
| curly-burst-fade.glasses_note | Fine; the arc curves round the arm. | Nav problēmu; griezuma loks apiet briļļu kājiņu. | ed99a608 |  |
| curly-burst-fade.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-burst-fade.grow_out | Allow the sides to fill: the burst softens into a taper in about 4 weeks. | Ļauj sāniem ataugt: burst aptuveni 4 nedēļu laikā kļūst maigāks un pārtop par taper. | 9cc0c3f5 |  |
| curly-burst-fade.client | A curly top with a curved fade around the ears and some length at the back. Bold, textured and tidy. | Cirtaina augšdaļa ar noapaļotu fade pāreju ap ausīm un saglabātu garumu aizmugurē. Drosmīgs, teksturēts un kopts tēls. | d769ea5f |  |
| curly-burst-fade.stylist | Draw a clean ear arc with a trimmer, blend it through #0.5-#2 and keep the nape at 2-3 cm. Cut the top dry in curl clumps. | Ar trimeri iezīmē precīzu loku ap ausi, izveido pāreju ar #0.5–#2 un pakausī saglabā 2–3 cm. Augšdaļu griez sausu, pa cirtu šķipsnām. | 00c87e2f |  |
| high-top-fade.name | High-top fade | High-top fade | 6b9329e5 | same |
| high-top-fade.fade.note | High fade to skin; the top left tall. | Augsta fade pāreja līdz ādai; augšdaļa atstāta izteikti augsta. | 9c05be2f |  |
| high-top-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| high-top-fade.texture_fit.straight.note | Not suited: use a flat top with straight hair and wax. | Nav piemērots: taisniem matiem labāk izvēlies flat top ar vasku. | ab2ef7a5 |  |
| high-top-fade.texture_fit.wavy.note | Not suited: waves lack the standing volume. | Nav piemērots: viļņainiem matiem trūkst vajadzīgā apjoma, lai tie stāvētu uz augšu. | 7dd9f704 |  |
| high-top-fade.texture_fit.curly.note | Works with defined curls 10+ cm; use a pick and gel. | Piemērots izteiktām cirtām no 10+ cm garuma; izmanto afro ķemmi un želeju. | 8158caa1 |  |
| high-top-fade.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| high-top-fade.density_fit.low.note | Keep the block lower so it looks filled. | Veido formu zemāku, lai tā izskatītos biezāka un blīvāka. | e7bc68eb |  |
| high-top-fade.growth.note | High fade exposes the hairline; avoid past stage 3. | Augsts fade atsedz matu augšanas līniju; izvairies, ja atkāpšanās pārsniedz 3. stadiju. | 08c24a58 |  |
| high-top-fade.density_note | Thick density; fine coils cannot hold the height. | Bieziem matiem; smalkas, sīkas cirtas nespēj noturēt augstumu. | 8d2024c5 |  |
| high-top-fade.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| high-top-fade.upkeep.products.0 | pick | afro ķemme | 8ce33c6c |  |
| high-top-fade.upkeep.products.1 | light oil | viegla eļļa | 7170b5ea |  |
| high-top-fade.grow_out | Fade grows to a taper in 3 weeks; top grows to an afro. | Fade 3 nedēļās pāraug par taper; augšdaļa izaug par afro. | b96e7ebf |  |
| high-top-fade.client | Very short sides with a tall flat-ish top. A retro statement that shows off texture. | Ļoti īsi sāni ar augstu, gandrīz plakanu augšdaļu. Pamanāms retro stils, kas izceļ matu tekstūru. | 3d925be6 |  |
| high-top-fade.stylist | Fade high to skin, shape the top with a pick and clippers into a tidy block, and keep the angle square. | Veido augstu fade līdz ādai, ar afro ķemmi un mašīnīti piešķir augšdaļai taisnstūra formu, saglabājot taisnu leņķi. | 285bd65b |  |
| flat-top.name | Flat top | Flat top | f199b77e | same |
| flat-top.fade.note | Low or mid taper; top is squared flat. | Low vai mid taper pāreja; augšdaļa piegriezta taisni un plakani. | 097ed2c2 |  |
| flat-top.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| flat-top.texture_fit.straight.note | Straight hair can stand with wax. | Taisnus matus var nostiprināt stāvus ar vasku. | 6e6652ec |  |
| flat-top.texture_fit.wavy.note | Hard to hold; use wax and a short top. | Grūti noturēt formu; lieto vasku un atstāj augšdaļu īsu. | 5d883047 |  |
| flat-top.texture_fit.curly.note | Works with a short, firm curl: needs product and a pick. | Piemērots īsām, stingrām cirtām; nepieciešams veidošanas līdzeklis un afro ķemme. | 9a9a9289 |  |
| flat-top.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| flat-top.density_fit.low.note | Keep the flat top short so the plane looks filled. | Atstāj plakano virsmu īsāku, lai tā izskatītos vienmērīgi bieza. | 6118fbbf |  |
| flat-top.growth.note | Squared front line shows the hairline. | Taisnā priekšējā līnija atsedz matu augšanas līniju. | 504f8a92 |  |
| flat-top.density_note | Medium to thick coarse hair stands up for the flat plane. | Vidējiem līdz bieziem, raupjiem matiem, kas turas stāvus un veido plakanu virsmu. | 801720e0 |  |
| flat-top.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| flat-top.upkeep.products.0 | pick | afro ķemme | 8ce33c6c |  |
| flat-top.grow_out | Grow the top for 6-8 weeks and it becomes a rounded afro or short crop. | Audzē augšdaļu 6–8 nedēļas, un tā kļūs par noapaļotu afro vai īsu crop griezumu. | 850e95e5 |  |
| flat-top.client | A flat, squared top with short sides. Distinctive and military-inspired. | Plakana, kantaina augšdaļa ar īsiem sāniem. Raksturīgs, militārā stila iedvesmots griezums. | 9720d1c2 |  |
| flat-top.stylist | Brush the top up, clip a flat plane using a comb guide and check it from the front and sides. Keep the fade neat. | Ķemmē augšdaļu uz augšu, ar mašīnīti virs ķemmes izveido taisnu plakni un pārbaudi to no priekšpuses un sāniem. Saglabā precīzu fade. | 5a6a3821 |  |
| curtains-middle-part.name | Curtains (middle part) | Curtains (ar celiņu vidū) | 19b372f5 |  |
| curtains-middle-part.sideburns | Long, blended | Garas, sapludinātas | 1e6ba014 |  |
| curtains-middle-part.texture_fit.wavy.note | A good fit. | Lieliski piemērots. | 5f82cd32 |  |
| curtains-middle-part.texture_fit.curly.note | Cut dry; curl pull-back matters. | Griez sausos matos; svarīgi ņemt vērā, cik ļoti cirtas sarausies. | d8ec49d8 |  |
| curtains-middle-part.texture_fit.coily.note | Short coils: 10 cm minimum. | Sīkām cirtām: vismaz 10 cm garums. | 20897baa |  |
| curtains-middle-part.density_fit.low.note | Keep the curtains shorter and textured; a centre part shows the scalp. | Atstāj matus īsākus un teksturētus; celiņš vidū atsedz galvas ādu. | 321ec622 |  |
| curtains-middle-part.growth.whorl_note | Cowlick at the front pushes the part. | Matu virpulis priekšpusē nobīda celiņu. | 232475b3 |  |
| curtains-middle-part.growth.note | Centre part shows the hairline; the curtains fall over the temple corners up to stage 2. | Vidusceliņš atsedz matu augšanas līniju; šķipsnas nosedz deniņu stūrus līdz pat 2. stadijai. | 323c6fbe |  |
| curtains-middle-part.density_note | Medium to thick; thin hair splits at the part. | Vidējiem līdz bieziem matiem; plāni mati pie celiņa šķiras. | bf0f1fa6 |  |
| curtains-middle-part.glasses_note | Hair should clear the frame. | Matiem nevajadzētu aizskart briļļu rāmi. | 5346b215 |  |
| curtains-middle-part.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| curtains-middle-part.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| curtains-middle-part.grow_out | Keep growing: the fringe reaches the cheekbones in about 4 months and becomes a medium flow. | Turpini audzēt: priekšmati aptuveni 4 mēnešos sasniegs vaigu kaulus un pārtaps par vidēja garuma flow griezumu. | be3c01b1 |  |
| curtains-middle-part.client | Medium-length hair parted down the middle that falls softly to each side. Relaxed and a little retro. | Vidēja garuma mati ar celiņu vidū, kas viegli krīt uz abām pusēm. Nepiespiests un nedaudz retro tēls. | 4e6626a8 |  |
| curtains-middle-part.stylist | Point cut for movement; shape the sides to meet the ears. Check the part sits where the hair falls. | Griez ar point cut tehniku, lai piešķirtu kustību; veido sānus līdz ausīm. Pārbaudi, vai celiņš ieguļas tur, kur mati dabiski krīt. | 9bb4044b |  |
| curtains-taper.name | Tapered curtains | Curtains ar taper pāreju | d53fc227 |  |
| curtains-taper.fade.note | Taper sides and neck; top stays long. | Taper pāreja sānos un uz kakla; augšdaļā saglabāts garums. | 5fa9c4b2 |  |
| curtains-taper.sideburns | Tapered | Ar taper pāreju | dcbacddd |  |
| curtains-taper.texture_fit.coily.note | Needs 10 cm+ to part; shape with a pick and moisturising cream, or choose a taper with defined twists. | Lai izveidotu celiņu, nepieciešams vismaz 10 cm+ garums; ieveido ar afro ķemmi un mitrinošu krēmu vai izvēlies taper ar izteiktiem «twist» pinumiem. | 864ccf2e |  |
| curtains-taper.density_fit.low.note | Keep the curtains shorter and textured; a centre part shows the scalp. | Atstāj matus īsākus un teksturētus; celiņš vidū atsedz galvas ādu. | 321ec622 |  |
| curtains-taper.growth.note | Curtains cover the corners of a stage 2-3 hairline when the fringe is thick. | Biezi priekšmati nosedz matu augšanas līnijas stūrus 2.–3. stadijā. | 8976ea1e |  |
| curtains-taper.density_note | Medium to thick; thin hair splits at the part. | Vidējiem līdz bieziem matiem; plāni mati pie celiņa šķiras. | bf0f1fa6 |  |
| curtains-taper.glasses_note | Hair at ear height may touch frames; shorten. | Mati ausu augstumā var aizskart rāmi; saīsini. | cd4c133d |  |
| curtains-taper.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| curtains-taper.grow_out | Keep growing: curtains reach the ears in 3-4 months. | Turpini audzēt: priekšmatu šķipsnas sasniegs ausis 3–4 mēnešos. | ce36df7f |  |
| curtains-taper.client | Curtains parted in the centre with neat tapered sides, a tidy choice for work. | Curtains griezums ar celiņu vidū un kārtīgiem taper sāniem – nevainojama izvēle darbam. | a23f1cbb |  |
| curtains-taper.stylist | Taper the sides and neck with a clipper, leave the top at 8-12 cm and cut the fringe to cheekbone length with a gentle curve. | Ar mašīnīti veido taper sānos un pie kakla, augšdaļā atstāj 8–12 cm un nogriez priekšmatus vaigu kaulu garumā ar maigu izliekumu. | dbc8e2d9 |  |
| flow-medium.name | Medium flow | Vidēja garuma flow | 4383f745 |  |
| flow-medium.sideburns | Long, blended | Garas, sapludinātas | 1e6ba014 |  |
| flow-medium.texture_fit.wavy.note | A good fit. | Lieliski piemērots. | 5f82cd32 |  |
| flow-medium.texture_fit.curly.note | Keep layers. | Saglabā pakāpi. | cec179d0 |  |
| flow-medium.texture_fit.coily.note | Needs 12 cm+. | Nepieciešams vismaz 12 cm+ garums. | 7571e52c |  |
| flow-medium.density_fit.low.note | Keep the layers few and the ends fuller so the length does not look sparse. | Veido minimālu pakāpi un atstāj biezākus matu galus, lai garums neizskatītos pārāk rets. | cff1a4ae |  |
| flow-medium.growth.note | Length covers the hairline; ok for stage 3. | Garums nosedz matu augšanas līniju; der arī 3. stadijai. | 47f8c375 |  |
| flow-medium.density_note | Medium to thick; thin hair looks stringy at length. | Vidējiem līdz bieziem matiem; plāni mati šādā garumā šķiras šķipsnās. | 65e7813c |  |
| flow-medium.glasses_note | Tuck behind the ear if needed. | Ja nepieciešams, aizliec aiz auss. | 08c4848f |  |
| flow-medium.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| flow-medium.grow_out | Just wait: it reaches the shoulder in about 6-8 months. | Vienkārši pagaidi: aptuveni 6–8 mēnešos mati sasniegs plecus. | b5edbe40 |  |
| flow-medium.client | Ear-to-collar hair that falls with a loose, relaxed shape. Needs little more than air-drying. | Mati no ausīm līdz apkaklei, kas dabiski un brīvi krīt. Pietiek vien ļaut matiem pašiem izžūt. | 650e7009 |  |
| flow-medium.stylist | Light layering around the crown, point-cut ends and a clean perimeter. Cut dry if the hair has a wave. Neckline follows natural hairline. | Viegla pakāpe virspusē, gali griezti point cut tehnikā un precīza kontūra. Ja mati ir viļņaini, griez sausus. Kakla līnija seko dabiskajai matu augšanas līnijai. | 57be751d |  |
| bro-flow.name | Bro flow | Bro flow | c23b20c3 | same |
| bro-flow.sideburns | Mid length | Vidēja garuma | 235563ec |  |
| bro-flow.texture_fit.wavy.note | Natural wave lifts. | Dabiskais vilnis paceļ matus. | 29d3781a |  |
| bro-flow.texture_fit.curly.note | Use cream and comb back. | Ieklāj krēmu un atķemmē matus atpakaļ. | b02cf215 |  |
| bro-flow.texture_fit.coily.note | Try twists. | Izmēģini «twist» pinumus. | f6879efe |  |
| bro-flow.density_fit.low.note | Use a texture spray; brushed-back length shows the scalp. | Lieto tekstūras spreju; atpakaļ atglausti mati var atsegt galvas ādu. | ec6b99ee |  |
| bro-flow.growth.note | Brushing back exposes the hairline; stage 2 limit. | Matus atglaužot, atsedzas matu augšanas līnija; piemērots līdz 2. stadijai. | 3117b35b |  |
| bro-flow.density_note | Medium to thick; fine hair needs a texture spray. | Vidējiem līdz bieziem matiem; smalkiem matiem nepieciešams tekstūras sprejs. | 0f5b482f |  |
| bro-flow.glasses_note | Fine; tuck behind the ear if the frame arms press. | Viss kārtībā; aizliec aiz auss, ja briļļu kājiņas spiež. | a4347cd7 |  |
| bro-flow.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| bro-flow.grow_out | Just wait; it reaches the collar in 3-4 months. | Vienkārši pagaidi; 3–4 mēnešos mati sasniegs apkaklīti. | 447db6f6 |  |
| bro-flow.client | Medium-length hair brushed back from the face with a natural shape. A relaxed, surf-style look. | Vidēja garuma mati, kas ar dabisku kritumu atglausti prom no sejas. Brīvs un nepiespiests sērferu stila tēls. | 0a483029 |  |
| bro-flow.stylist | Keep the sides slightly shorter than the back, layer internally and soften the ends so the flow falls back by itself. | Sānus veido nedaudz īsākus par aizmuguri, izveido iekšējo pakāpi un mīkstini galus, lai mati paši kristu atpakaļ. | e34e8beb |  |
| mod-fringe-90s.name | 90s mod fringe | 90. gadu mod priekšmati | 47c02897 |  |
| mod-fringe-90s.sideburns | Mid length | Vidēja garuma | 235563ec |  |
| mod-fringe-90s.texture_fit.coily.note | Needs a short rounded fringe; keep the top 4-6 cm and use a pick for the shape. | Nepieciešami īsi, noapaļoti priekšmati; augšdaļā atstāj 4–6 cm un formas veidošanai izmanto afro ķemmi. | a918823f |  |
| mod-fringe-90s.density_fit.low.note | Cut the fringe blunter with light layering so it keeps its weight. | Griez priekšmatus taisnāk ar vieglu pakāpi, lai saglabātu to biezumu. | 2186b40a |  |
| mod-fringe-90s.growth.note | Fringe covers temples at stage 2-3; beyond that the diagonal reveals the corners. | Priekšmati nosedz deniņus 2.–3. stadijā; ja atkāpšanās ir lielāka, diagonāle atsedz stūrus. | 722478df |  |
| mod-fringe-90s.density_note | Medium to thick; fine hair lacks the thick fringe weight. | Vidējiem līdz bieziem matiem; smalkiem matiem pietrūkst svara biezam priekšmatu kritumam. | c55d340a |  |
| mod-fringe-90s.glasses_note | Fine; keep the fringe above the frame. | Nav problēmu; turi priekšmatus virs briļļu rāmja. | 1e9c4ce4 |  |
| mod-fringe-90s.upkeep.products.0 | paste | matu pasta | a2c183d5 |  |
| mod-fringe-90s.grow_out | Easy: it moves into a medium flow in about 3 months. | Viegli: aptuveni 3 mēnešos tas pārtop par vidēja garuma flow griezumu. | 0b70b320 |  |
| mod-fringe-90s.client | A neat mop-top with a side-swept fringe, a retro 90s look that stays tidy. | Kārtīgs «mop-top» griezums ar uz sānu veidotiem priekšmatiem – retro 90. gadu tēls, kas vienmēr izskatās kopts. | 4dd74da1 |  |
| mod-fringe-90s.stylist | Cut the sides over the ears, the fringe to brow level with a slight diagonal and use point cutting to soften the edge. | Griez sānus pāri ausīm, priekšmatus uzacu līmenī ar nelielu diagonāli un mīkstini malu ar point cut tehniku. | 3da12cb5 |  |
| curly-flow.name | Curly flow | Cirtainais flow | f47f81d3 |  |
| curly-flow.sideburns | Blended | Sapludinātas | 80749709 |  |
| curly-flow.texture_fit.straight.note | Not suited: use a medium flow. | Nav piemērots: tā vietā izvēlies vidēja garuma flow. | 55fd7d0c |  |
| curly-flow.texture_fit.wavy.note | Waves can curl. | Viļņi var pāriet cirtās. | d20eb1b1 |  |
| curly-flow.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-flow.texture_fit.coily.note | Needs 12 cm+; shape with layers. | Nepieciešams vismaz 12 cm garums; veido formu ar pakāpēm. | 6e53bb8b |  |
| curly-flow.density_fit.low.note | Keep it at ear length with fewer layers so the curls keep their shape. | Atstāj matus līdz ausīm un veido mazāk pakāpju, lai cirtas saglabātu formu. | b0d64c8c |  |
| curly-flow.growth.note | Length and curls cover stage 3-4 recession. | Garums un cirtas nosedz atkāpušos matu līniju 3.–4. stadijā. | 1bf9766b |  |
| curly-flow.density_note | Medium to thick; fine curls lose their shape at length. | Vidējiem līdz bieziem matiem; smalkas cirtas garumā zaudē formu. | dd8a5553 |  |
| curly-flow.glasses_note | Hair may curl or drop over the arms of glasses; trim a clean channel behind the ear if frames sit on top of the hair. | Mati var lokoties vai krist pāri briļļu kājiņām; aiz ausīm izveido tīru līniju, ja rāmis balstās uz matiem. | b7f64717 |  |
| curly-flow.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-flow.upkeep.products.1 | oil | eļļa | ab7902bc |  |
| curly-flow.grow_out | Just wait; it reaches the shoulder in 6-8 months. | Vienkārši pagaidi; 6–8 mēnešos mati sasniegs plecus. | 7409b984 |  |
| curly-flow.client | Curls worn natural, from the ear to the collar. Soft, casual and low-fuss with a little cream. | Dabiskas cirtas no ausīm līdz apkaklei. Mīksts, nepiespiests un viegli kopjams stils – pietiek ar pavisam nedaudz krēma. | bc79abd4 |  |
| curly-flow.stylist | Cut dry, add short interior layers to remove bulk and keep the perimeter at ear or collar level. | Griez sausus, veido īsas iekšējās pakāpes biezuma noņemšanai un saglabā perimetru ausu vai apkakles līmenī. | 58089756 |  |
| bowl-cut-modern.name | Modern bowl cut | Modernais bļodiņgriezums | f338cf5a |  |
| bowl-cut-modern.fade.note | Low taper under the round fringe. | Zems taper zem noapaļotajiem priekšmatiem. | ecba2bc2 |  |
| bowl-cut-modern.sideburns | Short | Īsas | f5d61ead |  |
| bowl-cut-modern.texture_fit.curly.note | Works as a short curly bowl with a taper; keep the top 5 cm so curls do not puff. | Labi izskatās kā īss, cirtains bļodiņgriezums ar taper pāreju; augšdaļā atstāj 5 cm, lai cirtas nesapūkojas. | 403f29a0 |  |
| bowl-cut-modern.texture_fit.coily.note | Works as a short rounded top with a sponge finish; keep the taper tight. | Labi izskatās kā īsa, noapaļota augšdaļa ar sūkļa tekstūru; taper pārejai jābūt precīzai un gludai. | 1d35da41 |  |
| bowl-cut-modern.density_fit.low.note | Keep the fringe blunt and full; texturising makes it look wispy. | Veido priekšmatus taisnus un biezus; filējot tie izskatīsies pārāk plāni un caurredzami. | 369d5ce2 |  |
| bowl-cut-modern.growth.note | Rounded fringe covers temples. | Noapaļoti priekšmati nosedz deniņus. | 9acee3ac |  |
| bowl-cut-modern.density_note | Thick to medium; thin hair looks wispy at the fringe. | Biezi līdz vidēji biezi; plāniem matiem priekšmati izskatās caurspīdīgi. | abf4bd41 |  |
| bowl-cut-modern.glasses_note | A heavy rounded fringe can touch the top rim of frames; keep the fringe 1 cm above it. | Biezi noapaļoti priekšmati var skart rāmja augšmalu; atstāj priekšmatus 1 cm virs tās. | 0617679f |  |
| bowl-cut-modern.upkeep.products.0 | paste | matu pasta | a2c183d5 |  |
| bowl-cut-modern.grow_out | Easy: a fuller bowl becomes a curtain style in 3 months. | Viegli: biezāks bowl griezums 3 mēnešos pārtop par aizkariņu griezumu. | 028ca0da |  |
| bowl-cut-modern.client | A rounded fringe with short sides. Retro and low maintenance, with a modern textured top. | Noapaļoti priekšmati ar īsiem sāniem. Retro noskaņa un viegla kopšana ar modernu, teksturētu augšdaļu. | b8fc9c5c |  |
| bowl-cut-modern.stylist | Cut the round shape with scissors over the comb, texturise the ends and keep the fringe soft. | Veido apaļo formu ar šķērēm virs ķemmes, teksturē galus un atstāj priekšmatus mīkstus. | 30beb204 |  |
| blunt-fringe-taper.name | Blunt fringe with taper | Taisni priekšmati ar taper | 3ee9a1bb |  |
| blunt-fringe-taper.fade.note | Low taper or fade. | Zems taper vai fade. | a6e52c11 |  |
| blunt-fringe-taper.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| blunt-fringe-taper.texture_fit.curly.note | Cut with the curls dry and keep the fringe at the shorter end. | Griez cirtas sausos matos un priekšmatus veido drīzāk īsus. | 7fbceb2e |  |
| blunt-fringe-taper.texture_fit.coily.note | Keep the fringe short (2-3 cm) and shape the line with a trimmer. | Priekšmatus atstāj īsus (2–3 cm) un līniju iezīmē ar trimeri. | 75cbb085 |  |
| blunt-fringe-taper.density_fit.low.note | Keep the fringe shorter and solid; a blunt line shows gaps on low density. | Veido priekšmatus īsākus un biezus; retākiem matiem taisna līnija var izskatīties robaina. | 6fc59888 |  |
| blunt-fringe-taper.growth.note | Straight fringe covers a stage 3-4 front. | Taisni priekšmati nosedz 3.–4. stadijas atkāpšanos priekšpusē. | 3e5e19d1 |  |
| blunt-fringe-taper.density_note | Thick, straight hair works best. | Vislabāk piemēroti biezi, taisni mati. | 56705f97 |  |
| blunt-fringe-taper.glasses_note | Keep the fringe clear of the frame. | Priekšmatiem nevajadzētu skart briļļu rāmi. | a680bb5a |  |
| blunt-fringe-taper.upkeep.products.0 | paste | matu pasta | a2c183d5 |  |
| blunt-fringe-taper.grow_out | Let the fade grow and the fringe lengthen: it becomes a French crop in about 6 weeks. | Ļauj fade ataugt un priekšmatiem paaugties garākiem: aptuveni 6 nedēļās tas pārtop par French crop. | fba18eea |  |
| blunt-fringe-taper.client | A straight horizontal fringe with faded sides. Graphic, neat and easy to keep sharp. | Taisni horizontāli priekšmati ar fade pāreju sānos. Grafisks, glīts un viegli uzturams griezums, kas saglabā precīzu formu. | d2160a5d |  |
| blunt-fringe-taper.stylist | Cut the fringe straight with scissors, fade sides from #0.5 to #2 and soften the front edges with a point cut. | Ar šķērēm taisni nogriez priekšmatus, sānos veido fade no #0.5 līdz #2 un priekšējās malas mīkstini ar point cut. | 42863440 |  |
| two-block.name | Two-block cut | Two-block griezums | aed6af41 |  |
| two-block.sideburns | Short | Īsas | f5d61ead |  |
| two-block.texture_fit.curly.note | Works with a loose curl; keep the upper block 6-8 cm. | Piemērots vieglām cirtām; augšējo daļu atstāj 6–8 cm garu. | 82bba3a4 |  |
| two-block.texture_fit.coily.note | Not typical; choose a taper with a defined top instead. | Nav tipiska izvēle; tā vietā labāk izvēlies taper ar izteiktu augšdaļu. | f234c63c |  |
| two-block.density_fit.low.note | Keep the upper block shorter and use a volumising spray. | Augšējo daļu atstāj īsāku un lieto apjoma spreju. | 3c4fe4c0 |  |
| two-block.growth.note | Fringe covers the forehead. | Priekšmati nosedz pieri. | a44dd6ed |  |
| two-block.density_note | Medium to thick; fine hair loses the soft comma shape. | Vidēji līdz biezi; smalki mati zaudē maigo komata formu. | 70d7aa86 |  |
| two-block.glasses_note | The fringe should sit above the frame top so it does not catch on the rim. | Priekšmatiem jābūt virs rāmja augšmalas, lai tie neaizķertos aiz apmales. | b742b0da |  |
| two-block.upkeep.products.0 | light wax | viegls vasks | 94347f09 |  |
| two-block.grow_out | Keep the upper block and stop disconnecting the lower: it becomes a short flow in 2-3 months. | Saglabā augšējo daļu un vairs neatdali apakšējo: 2–3 mēnešos tas pārtop par īsu flow griezumu. | 988c297b |  |
| two-block.client | Short sides with a soft longer top that falls onto the forehead. Light, youthful and low maintenance. | Īsi sāni ar mīkstu, garāku augšējo daļu, kas krīt uz pieres. Viegls, jauneklīgs un neprasa daudz kopšanas. | 209f8774 |  |
| two-block.stylist | Section above the ear, disconnect the lower block with a #1-#3, then point cut the upper block for a soft comma shape. | Atdali sekciju virs auss, noīsini apakšējo bloku ar #1–#3, tad ar point cut piegriez augšējo daļu, veidojot maigu komata formu. | b2b75894 |  |
| collarbone-lob-blunt.name | Blunt collarbone lob | Taisns lobs līdz atslēgas kaulam | 3e253bf9 |  |
| collarbone-lob-blunt.texture_fit.wavy.note | cut dry and allow 4-6 cm for spring; blunt works best on straight to loosely wavy hair | griez sausos matos un ierēķini 4–6 cm saraušanās rezervi; taisns griezums vislabāk piemērots taisniem līdz viegli viļņainiem matiem | 284bb58f |  |
| collarbone-lob-blunt.texture_fit.curly.note | blunt lines turn triangular, choose curly-lob-rounded | taisnas līnijas iegūst trijstūra formu, izvēlies curly-lob-rounded | 5a9db3f5 |  |
| collarbone-lob-blunt.texture_fit.coily.note | choose coily-blunt-ended-midi | izvēlies coily-blunt-ended-midi | 2db97359 |  |
| collarbone-lob-blunt.density_fit.high.note | take internal weight out behind the ears | noņem iekšējo biezumu aiz ausīm | e1dcb5cb |  |
| collarbone-lob-blunt.growth.note | The line shows any shoulder flick, so check how the ends behave when the head moves. | Līnija izceļ jebkuru matu atliekšanos pret pleciem, tāpēc pārbaudi, kā gali uzvedas, galvai kustoties. | f528f49a |  |
| collarbone-lob-blunt.strand_note | Fine strands look thicker on a blunt line; coarse strands add heaviness and need debulking. | Smalki mati ar taisnu griezuma līniju izskatās biezāki; rupji mati rada lieku smagumu, tāpēc no tiem jānoņem biezums. | 98f1da9f |  |
| collarbone-lob-blunt.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| collarbone-lob-blunt.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| collarbone-lob-blunt.grow_out | Easy to grow; trim every 8-10 weeks and it stays sharp for months. | Viegli ataudzēt; pielīdzini ik pēc 8–10 nedēļām, un griezums mēnešiem ilgi saglabāsies precīzs. | a452cee1 |  |
| collarbone-lob-blunt.client | A sleek, one-length cut that just touches the collarbone. Smooth, simple and quick when the hair is straight. | Gluds, vienā garumā griezts lob, kas tikko sniedzas līdz atslēgas kaulam. Glīts, vienkāršs un ātri ieveidojams, ja mati ir taisni. | c92e2ef3 |  |
| collarbone-lob-blunt.stylist | Cut the perimeter on a level line with the head upright and slightly angled forward at the front. Check the line while the client looks down and up, because shoulders push the ends. Weight: all the weight sits on one clean line at the collarbone. | Griez perimetru taisnā līnijā, galvu turot taisni un priekšpusē nedaudz noliektu uz priekšu. Pārbaudi līniju, klientam skatoties uz leju un augšu, jo pleci atliec matu galus. Masa: visa masa gulstas vienā tīrā līnijā pie atslēgas kaula. | a77ea79d |  |
| textured-lob.name | Textured lob | Teksturēts lob | e7d74b00 |  |
| textured-lob.texture_fit.curly.note | cut dry; define waves with a diffuser | griez sausos matos; viļņus izcel ar difuzoru | d2b9f28b |  |
| textured-lob.texture_fit.coily.note | keep layers long so curls form rather than stack | atstāj garas pakāpes, lai cirtas veidotu formu, nevis gultos viena virs otras | 5daf91bb |  |
| textured-lob.density_fit.low.note | fine hair needs lighter texturising | smalkiem matiem nepieciešama vieglāka teksturēšana | 52c4d11f |  |
| textured-lob.density_fit.high.note | good for debulking | labi noder biezuma noņemšanai | 2fb509bc |  |
| textured-lob.growth.note | Choppy ends can highlight a cowlick at the front, so cut those pieces longer. | Teksturēti gali var izcelt virpuli priekšpusē, tāpēc šīs šķipsnas atstāj garākas. | 4fc869ee |  |
| textured-lob.strand_note | Thick or coarse strands benefit most; fine strands need a light hand to avoid see-through ends. | Vislabāk piemērots bieziem vai rupjiem matiem; smalkiem matiem filēšana jāveic uzmanīgi, lai matu gali nekļūtu caurspīdīgi. | 8dbaabb8 |  |
| textured-lob.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| textured-lob.upkeep.products.1 | texturising paste | teksturējoša pasta | 5811656a |  |
| textured-lob.grow_out | A forgiving grow-out; it keeps its shape for 4-5 months with minor trims. | Pateicīgs ataugšanai: ar minimālu pielīdzināšanu saglabā formu 4–5 mēnešus. | 91b89b5f |  |
| textured-lob.client | A shoulder-grazing cut with soft, messy ends. It looks right when it is dried naturally. | Griezums līdz pleciem ar mīkstiem, viegli izspūrušiem galiem. Izskatās lieliski, kad mati izžūst dabiski. | 855568ed |  |
| textured-lob.stylist | Cut a firm base line, then point cut and slide cut the ends and add a few long internal layers. Leave the perimeter intentionally imperfect. Weight: weight kept at the perimeter, with broken ends and light interior layers. | Nogriez stingru bāzes līniju, pēc tam galos izmanto point cut un slide cut tehniku un izveido dažas garas iekšējās pakāpes. Perimetru apzināti atstāj nedaudz nevienmērīgu. Masa: masa saglabāta perimetrā, ar gaisīgiem galiem un vieglām iekšējām pakāpēm. | f9cd8e34 |  |
| a-line-lob.name | A-line lob | A-līnijas lob | 6119ce38 |  |
| a-line-lob.texture_fit.curly.note | soften the diagonal for loose curls | vieglām cirtām padari diagonālo līniju maigāku | 0c600ef9 |  |
| a-line-lob.texture_fit.coily.note | see curly-a-line-bob | skatīt curly-a-line-bob | 136bc8b2 |  |
| a-line-lob.density_fit.high.note | remove weight at the nape | noņem lieko apjomu pakauša daļā | 1b40e0f1 |  |
| a-line-lob.growth.note | A shorter back shows the nape growth pattern. | Īsāka aizmugure atsedz matu augšanas virzienu kakla zonā. | b53a40fe |  |
| a-line-lob.strand_note | Smooth fine hair suits the clean diagonal; coarse hair needs thinning at the nape. | Gludiem, smalkiem matiem piestāv precīzā diagonāle; rupjiem matiem nepieciešams noņemt biezumu pakauša daļā. | 447f4db8 |  |
| a-line-lob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| a-line-lob.upkeep.products.1 | shine spray | spīduma sprejs | d0399526 |  |
| a-line-lob.grow_out | Growing out a shorter back eventually evens out; trim to keep the angle. | Ataugot īsākā aizmugure ar laiku izlīdzinās; pielīdzini matus, lai saglabātu leņķi. | 72083fc6 |  |
| a-line-lob.client | A lob that is a little longer in front than at the back, with a clean slanted shape. | Lob griezums, kas priekšpusē ir nedaudz garāks nekā aizmugurē, ar tīru, slīpu formu. | 4254e08c |  |
| a-line-lob.stylist | Angle the back shorter by 5-8 cm and keep the front long; avoid a shelf by blending behind the ears. Weight: weight on a diagonal, shorter at the back and longer in front. | Aizmuguri veido par 5–8 cm īsāku un priekšpusi atstāj garu; aiz ausīm rūpīgi sapludini, lai neveidotos pakāpiens. Masa: masa virzīta pa diagonāli — īsāka aizmugurē, garāka priekšpusē. | 68ead768 |  |
| wavy-lob.name | Air-dry wavy lob | Dabiski žāvējams viļņains lob | c8a0f9fe |  |
| wavy-lob.texture_fit.curly.note | cut dry or damp in the wave pattern | griezt sausos vai mitros matos, ievērojot viļņu kritumu | 5e1d6ade |  |
| wavy-lob.texture_fit.coily.note | keep the length longer for spring | atstāj lielāku garumu, ierēķinot saraušanos | 852a47dc |  |
| wavy-lob.growth.note | Check for a cowlick at the crown because waves emphasise it. | Pārbaudi virpuli galvvidū, jo viļņi to īpaši izceļ. | d97d797b |  |
| wavy-lob.strand_note | Fine to medium waves show the layers. Thick waves push outward unless the inside is lightly layered. | Pakāpes vislabāk redzamas smalkos līdz vidēji biezos viļņos. Biezi viļņaini mati kuplo uz āru, ja vien iekšpusē nav izveidotas vieglas pakāpes. | 8bd01ac0 |  |
| wavy-lob.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| wavy-lob.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| wavy-lob.grow_out | Grows into a wavy midi cut with no awkward length, so trims can be spaced at 10-12 weeks. | Ataugot kļūst par viļņainu midi griezumu bez neērta pārejas posma, tāpēc galus var pielīdzināt vien ik pēc 10–12 nedēļām. | 4b7222f3 |  |
| wavy-lob.client | A collarbone-length cut with long layers that let natural waves fall into shape. It dries well on its own. | Griezums līdz atslēgas kaulam ar garām pakāpēm, kas ļauj dabiskajiem viļņiem skaisti iegulties formā. Mati lieliski izskatās, izžūstot dabiski. | d3831a9b |  |
| wavy-lob.stylist | Cut a base line at the collarbone, then add long layers that follow the wave pattern. Weight: weight kept at the perimeter with long layers to free the waves. | Izveido bāzes līniju pie atslēgas kaula, tad piegriez garas pakāpes, kas seko viļņu zīmējumam. Masa: perimetrā saglabāts biezums ar garām pakāpēm, kas atbrīvo viļņus. | acbf7ec7 |  |
| asymmetric-lob.name | Asymmetric lob | Asimetrisks lob | a9dcbda7 |  |
| asymmetric-lob.texture_fit.curly.note | cut dry to see the curl pattern and keep the long side 3 cm longer | griez sausos matos, lai redzētu cirtu kritumu, un garāko pusi atstāj par 3 cm garāku | a2eacb65 |  |
| asymmetric-lob.texture_fit.coily.note | see curly-asymmetric-bob | skatīt curly-asymmetric-bob | 87352ca9 |  |
| asymmetric-lob.density_fit.low.note | fine hair may droop on the long side, so keep the line blunt | smalki mati garākajā pusē var zaudēt apjomu, tāpēc griezuma līniju veido taisnu | 2a363015 |  |
| asymmetric-lob.growth.note | Match the long side to the natural part and check that the crown whorl does not twist the line. | Pielāgo garāko pusi dabiskajam celiņam un pārbaudi, vai virpulis galvvidū nesagriež līniju. | e69edadf |  |
| asymmetric-lob.strand_note | The long side needs enough strand strength to hold its edge. | Garākajā pusē matiem jābūt pietiekami stingriem, lai noturētu līniju. | c5091549 |  |
| asymmetric-lob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| asymmetric-lob.upkeep.products.1 | texture spray | tekstūras sprejs | 9bf0ec6a |  |
| asymmetric-lob.grow_out | Even out the short side over 3-4 months to return to a regular lob. | Pielīdzini īsāko pusi 3–4 mēnešu laikā, lai atgrieztos pie klasiskā loba. | 2a3f0998 |  |
| asymmetric-lob.client | A lob with one side clearly longer than the other. It feels fashion-led and swings when you move. | Lob griezums ar vienu izteikti garāku pusi. Moderns stils ar dinamisku kustību ik uz soļa. | b134854d |  |
| asymmetric-lob.stylist | Set the part first, then angle the perimeter from the short side to the long side with a visible but soft diagonal; blend at the back so it does not look cut in two. Weight: one side lands at the jaw, the other at the collarbone, with the back blended between. | Vispirms izveido celiņu, tad veido perimetru leņķī no īsākās puses uz garāko ar pamanāmu, bet maigu diagonāli; aizmugurē sapludini, lai griezums neizskatītos pāršķelts divās daļās. Masa: viena puse sniedzas līdz žoklim, otra – līdz atslēgas kaulam, aizmugurē tām plūstoši savienojoties. | 2395c22b |  |
| graduated-lob.name | Graduated lob | Graduēts lob | 3af1339e |  |
| graduated-lob.texture_fit.curly.note | graduation adds bulk at the back on curls; see curly-lob-rounded | cirtām graduējums aizmugurē rada lieku apjomu; skaties curly-lob-rounded | ca0fb3a3 |  |
| graduated-lob.texture_fit.coily.note | see coily-layered-midi-stacked | skatīt coily-layered-midi-stacked | 84166145 |  |
| graduated-lob.density_fit.low.note | fine hair thins in the stack, keep it shallow | smalki mati pakāpeniskajā pārejā kļūst pārāk plāni, tāpēc veido to lēzenu | d1ce250c |  |
| graduated-lob.density_fit.high.note | thin the stacked section | noņem lieko biezumu gradētajā zonā | 2550c658 |  |
| graduated-lob.growth.note | Check the occipital bone and nape hair direction before graduating. | Pirms gradācijas veidošanas novērtē pakauša kaulu un matu augšanas virzienu kakla zonā. | 307179ae |  |
| graduated-lob.strand_note | The stack suits medium strands; coarse strands need thinning to avoid a shelf. | Pakāpenisks apjoms vislabāk piemērots vidēja biezuma matiem; rupjus matus nepieciešams izfilēt, lai neveidotos smagnējs pakāpiens. | 9c51198e |  |
| graduated-lob.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| graduated-lob.upkeep.products.1 | smoothing serum | nogludinošs serums | 7074d46d |  |
| graduated-lob.grow_out | The stack relaxes into a rounded lob after about 3 months. | Pēc aptuveni 3 mēnešiem gradētā daļa nosēžas, pārtopot noapaļotā lobā. | 27794bd3 |  |
| graduated-lob.client | A long bob that is a little shorter and fuller at the back, with long, face-framing front pieces. | Garais bobs, kas aizmugurē ir nedaudz īsāks un apjomīgāks, ar garām, seju ierāmējošām šķipsnām priekšpusē. | 85133f98 |  |
| graduated-lob.stylist | Lift a shallow graduation through the back, no more than 2-3 cm of stacking, then blend into long sides and cut the front longer than the back. Weight: a gentle stack at the back lifts the length while the front stays long. | Aizmugurē veido vieglu gradāciju – ne vairāk kā 2–3 cm pacēluma –, tad sapludini ar garajiem sāniem un piegriez priekšpusi garāku par aizmuguri. Masa: neliels pacēlums aizmugurē paceļ garumu, kamēr priekšpuse paliek gara. | cf3c7a52 |  |
| invisible-layer-lob.name | Invisible-layer lob | Lob ar neredzamajām pakāpēm | 11f64167 |  |
| invisible-layer-lob.texture_fit.curly.note | cut dry and allow for the curl shape | griez sausos matos un ņem vērā cirtu formu | 73076c20 |  |
| invisible-layer-lob.texture_fit.coily.note | blunt outlines become triangular on coils; see coily-blunt-ended-midi | sīkām cirtām taisnas kontūras iegūst trijstūra formu; skaties coily-blunt-ended-midi | 567fff7f |  |
| invisible-layer-lob.density_fit.high.note | the hidden layers remove weight without a visible change | slēptās pakāpes noņem smagumu bez redzamām pārmaiņām | 836d00dd |  |
| invisible-layer-lob.growth.note | Check cowlicks in the crown and front hairline before cutting hidden layers. | Pirms slēpto pakāpju griešanas pārbaudi virpuļus galvvidū un priekšējā matu augšanas līnijā. | ba08ed2d |  |
| invisible-layer-lob.strand_note | Works with all strand sizes; fine strands keep their fullness at the ends. | Piemērots jebkura biezuma matiem; smalki mati saglabā galiņu blīvumu. | 579fa028 |  |
| invisible-layer-lob.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| invisible-layer-lob.upkeep.products.1 | light mousse | vieglas fiksācijas putas | afc8a642 |  |
| invisible-layer-lob.grow_out | Grows into a shoulder-length cut with a stable shape. | Ataug par plecu garuma griezumu ar stabilu formu. | b94b5ed3 |  |
| invisible-layer-lob.client | A cut that looks one-length from outside but moves much better than a plain blunt lob. | Griezums, kas no ārpuses izskatās vienā garumā, taču kustas daudz dzīvīgāk nekā parasts taisns lob. | addec5f1 |  |
| invisible-layer-lob.stylist | Cut the base perimeter first, then add long layers within the interior on dry hair, ending 5 cm above the perimeter so the outline stays solid. Weight: blunt outline with a few long layers hidden beneath the top. | Vispirms nogriez pamata perimetru, pēc tam sausos matos veido garas iekšējās pakāpes, noslēdzot tās 5 cm virs perimetra, lai kontūra saglabātos blīva. Masa: taisna kontūra ar dažām garām pakāpēm, kas paslēptas zem virsējiem matiem. | 176f44b0 |  |
| curtain-fringe-lob.name | Lob with a curtain fringe | Lobs ar aizkaru priekšmatiem | fc16f158 |  |
| curtain-fringe-lob.texture_fit.curly.note | let the fringe fall naturally and cut it dry | ļauj priekšmatiem krist dabiski un griez tos sausos matos | 12f2cd75 |  |
| curtain-fringe-lob.texture_fit.coily.note | see curly-curtain-fringe-shoulder | skaties curly-curtain-fringe-shoulder | d594ad71 |  |
| curtain-fringe-lob.density_fit.high.note | thin the fringe | izfilē priekšmatus | d44b5c03 |  |
| curtain-fringe-lob.growth.note | Check the front hairline; a calm part is needed for a centre-parted fringe. | Pārbaudi priekšējo matu augšanas līniju – priekšmatiem ar vidusceliņu nepieciešams mierīgs celiņš. | 1677cfa3 |  |
| curtain-fringe-lob.strand_note | Medium strands suit a curtain fringe best. | Aizkarveida priekšmati vislabāk piestāv vidēja biezuma matiem. | 0dedc4b8 |  |
| curtain-fringe-lob.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| curtain-fringe-lob.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| curtain-fringe-lob.grow_out | The fringe grows into face-framing layers in 8-12 weeks. | 8–12 nedēļu laikā priekšmati ataug par seju ierāmējošām pakāpēm. | 28da95f7 |  |
| curtain-fringe-lob.client | A lob with a fringe that parts in the middle and blends into the sides. | Lob griezums ar priekšmatiem, kas pašķiras vidū un saplūst ar sānu šķipsnām. | c7ad2d90 |  |
| curtain-fringe-lob.stylist | Section a V at the front hairline, cut the fringe long and angled, then link it to the side lengths. Weight: weight at the perimeter with long layers merging into a curtain fringe. | Priekšējā matu augšanas līnijā izdali V veida sekciju, nogriez garus, slīpus priekšmatus un savieno tos ar sānu garumu. Masa: blīvs perimetrs ar garām pakāpēm, kas saplūst ar aizkarveida priekšmatiem. | cf5ddda0 |  |
| thick-hair-debulked-lob.name | Debulked lob for thick hair | Atvieglots lob bieziem matiem | 054670d4 |  |
| thick-hair-debulked-lob.texture_fit.curly.note | thin gently on curls and cut channels in the interior only, never near the roots | cirtas filē saudzīgi un iekšējos griezumus veido tikai matu iekšpusē, nekad tuvu saknēm | e24e51ca |  |
| thick-hair-debulked-lob.texture_fit.coily.note | keep the debulking inside and avoid shortening the length | apjomu noņem tikai no iekšpuses un nesaīsini matu garumu | ea3ac970 |  |
| thick-hair-debulked-lob.density_fit.low.note | too little density to remove weight from | pārāk mazs matu blīvums, lai noņemtu apjomu | e26ad9c8 |  |
| thick-hair-debulked-lob.density_fit.medium.note | hair of medium density needs just a little weight taken out | vidēja biezuma matiem nepieciešams noņemt pavisam nedaudz apjoma | efd46487 |  |
| thick-hair-debulked-lob.growth.note | Do not thin around a crown whorl, because the shortened hairs will stand up. | Neretini matus ap virpuli galvvidū, jo saīsinātie mati celsies stāvus. | 23725106 |  |
| thick-hair-debulked-lob.strand_note | Designed for thick, dense or coarse strands that feel heavy and expand sideways. | Paredzēts bieziem, blīviem vai raupjiem matiem, kas šķiet smagnēji un kuplo uz sāniem. | e380f1d4 |  |
| thick-hair-debulked-lob.upkeep.products.0 | smoothing cream | nogludinošs krēms | 16bbc1bd |  |
| thick-hair-debulked-lob.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| thick-hair-debulked-lob.grow_out | Because the weight is removed inside, it grows out slowly and still looks shaped at 12 weeks. | Tā kā masa noņemta no iekšpuses, griezums ataug lēnām un saglabā formu pat pēc 12 nedēļām. | 09986c95 |  |
| thick-hair-debulked-lob.client | A lob that feels lighter and dries faster, with the same outline as a solid one-length lob. | Lob griezums, kas šķiet vieglāks un ātrāk žūst, saglabājot tādu pašu formu kā klasisks vienāda garuma lob. | 7371f44c |  |
| thick-hair-debulked-lob.stylist | Slide cut or channel cut the interior in the mid-lengths, leaving the outer perimeter layer untouched, and cut the weight out behind the ears and at the nape. Weight: bulk removed from inside the lengths while the perimeter is left dense. | Ar slīdošo griezumu (slide cut) vai kanālu griezumu apstrādā iekšējos slāņus matu vidusdaļā, neskarot ārējo perimetra kārtu, un noņem lieko masu aiz ausīm un kakla zonā. Masa: biezums noņemts no iekšpuses, saglabājot blīvu perimetru. | 7d8299be |  |
| curly-lob-rounded.name | Rounded curly lob | Noapaļots cirtainais lobs | 493f4c88 |  |
| curly-lob-rounded.texture_fit.straight.note | blunt lines turn triangular; choose collarbone-lob-blunt | taisnas līnijas iegūst trijstūra formu; izvēlies collarbone-lob-blunt | 783fb8e4 |  |
| curly-lob-rounded.texture_fit.coily.note | keep layers slightly longer and shape the outline in stretched sections | atstāj pakāpes nedaudz garākas un veido kontūru, šķipsnas viegli izstiepjot | 40da2f82 |  |
| curly-lob-rounded.density_fit.low.note | fine curls look sparse at the ends, so keep layers minimal | smalkas cirtas galos izskatās retas, tāpēc veido minimālas pakāpes | 746e990d |  |
| curly-lob-rounded.density_fit.high.note | thick curls need interior thinning | biezām cirtām no iekšpuses jānoņem liekais biezums | fbe0322b |  |
| curly-lob-rounded.growth.note | Look at the crown for whorls, because the curls spiral there. | Pārbaudi, vai galvvidū nav virpuļu, jo cirtas tur veido spirāles. | 5ca65db2 |  |
| curly-lob-rounded.strand_note | Medium to thick curls keep the round outline best; fine curls need density at the ends. | Vidēji biezi līdz biezi cirtaini mati vislabāk saglabā apaļo kontūru; smalkām cirtām nepieciešams blīvums matu galos. | 474be7e4 |  |
| curly-lob-rounded.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-lob-rounded.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| curly-lob-rounded.grow_out | Grows into a shoulder-length curly cut without a visible step. | Ataug par plecu garuma cirtainu griezumu bez pamanāmas pārejas. | d04d9279 |  |
| curly-lob-rounded.client | A bouncy, collarbone-length cut that keeps a round shape. | Dinamisks griezums līdz atslēgas kaulam, kas saglabā skaisti noapaļotu formu. | 45a7c7d5 |  |
| curly-lob-rounded.stylist | Cut dry curl by curl, starting with the length at the back and sides, and shape the outline round with the shortest layers at the crown. Weight: weight kept at the ends but shaped into a round outline, with shortest layers at the crown. | Griez sausos matos cirtu pa cirtai, sākot ar garumu aizmugurē un sānos, un veido noapaļotu formu ar īsākajām pakāpēm galvvidū. Masa: matu galos saglabāts biezums, veidojot noapaļotu kontūru ar īsākajām pakāpēm galvvidū. | 2822edcc |  |
| hush-lob.name | Korean hush lob | Korejiešu hush lob | 44e77f09 |  |
| hush-lob.texture_fit.curly.note | the layers shrink and the feathered hem disappears | pakāpes sarausies un izfilētā apakšējā līnija pazudīs | dbdf1d5a |  |
| hush-lob.texture_fit.coily.note | the layers shrink and the feathered hem disappears | pakāpes sarausies un izfilētā apakšējā līnija pazudīs | dbdf1d5a |  |
| hush-lob.density_fit.low.note | keep the ends fuller and cut the layers lightly | atstāj matu galus biezākus un veido vieglas pakāpes | 9e10c864 |  |
| hush-lob.density_fit.high.note | the light layers take weight out of thick hair | vieglās pakāpes noņem lieko smagumu no bieziem matiem | 49fb7ff4 |  |
| hush-lob.growth.note | A front cowlick lifts the see-through fringe, so check it before cutting. | Virpulis priekšpusē paceļ gaisīgos priekšmatus, tāpēc pirms griešanas to pārbaudi. | 174b1877 |  |
| hush-lob.strand_note | Fine to medium strands suit the wispy pieces. Thick, coarse strands look heavy at the front. | Smalki līdz vidēji biezi mati ir lieliski piemēroti gaisīgajām šķipsnām. Biezi, raupji mati priekšpusē izskatīsies smagnēji. | 4e47424a |  |
| hush-lob.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| hush-lob.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| hush-lob.grow_out | Grows into a shoulder-length layered cut with no clear line. | Ataug par plecu garuma pakāpenisku griezumu bez izteiktas līnijas. | a995a729 |  |
| hush-lob.client | A collarbone cut with light layers from the chin and a few see-through strands across the brow. Soft pieces are swept back at the front. The hem is feathered, not blunt. | Griezums līdz atslēgas kaulam ar vieglām pakāpēm no zoda līnijas un dažām gaisīgām šķipsnām pāri pierei. Priekšējās šķipsnas ir maigi vērstas uz aizmuguri. Apakšējā līnija ir izfilēta, nevis taisna. | 631f5a8a |  |
| hush-lob.stylist | Cut light layers from the chin, with no short crown layers. Sweep the front pieces back and feather the hem. Keep a see-through fringe of 5-9 cm, or none. Check that the back hem sits at the base of the neck (24-30 cm), clear of the shoulders. Weight: light layers with a feathered hem and wispy front pieces. | Veido vieglas pakāpes, sākot no zoda līnijas, bez īsām pakāpēm galvvidū. Virzi priekšējās šķipsnas uz aizmuguri un izfilē apakšējo malu. Izveido 5–9 cm garus gaisīgos priekšmatus vai iztiec bez tiem. Pārliecinies, ka aizmugurējā mala atrodas pie kakla pamatnes (24–30 cm), neskarot plecus. Masa: vieglas pakāpes ar filētu apakšējo malu un gaisīgām priekšējām šķipsnām. | 72eda9a4 |  |
| long-one-length-blunt.name | Long blunt one-length | Gari mati vienā taisnā garumā | 2f1a1f43 |  |
| long-one-length-blunt.texture_fit.curly.note | allow extra length and shape curls inside to avoid a triangle | atstāj papildu garumu un veido cirtām iekšējās pakāpes, lai izvairītos no trijstūra formas | 8f278fb6 |  |
| long-one-length-blunt.texture_fit.coily.note | cut as a stretched-length trim and keep layers minimal | līdzini matus, šķipsnas izstiepjot, un veido minimālas pakāpes | 7948c4a1 |  |
| long-one-length-blunt.density_fit.high.note | take out interior weight at the nape | noņem iekšējo apjomu pakauša daļā | f3436778 |  |
| long-one-length-blunt.growth.note | Check the nape growth direction, because a long blunt line shows it. | Pārbaudi matu augšanas virzienu kakla zonā, jo gara, taisna līnija to skaidri parāda. | b28d0b76 |  |
| long-one-length-blunt.strand_note | Fine strands look thicker with a straight edge but show thin ends sooner; thick hair feels heavy. | Smalki mati ar taisnu griezuma līniju izskatās biezāki, taču to gali ātrāk kļūst plāni; biezi mati šķiet smagnēji. | 016e8a5c |  |
| long-one-length-blunt.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| long-one-length-blunt.upkeep.products.1 | light oil | viegla eļļa | 7170b5ea |  |
| long-one-length-blunt.grow_out | Needs only dusting trims; every 12-16 weeks keeps the ends healthy. | Nepieciešama tikai matu galu pielīdzināšana (dusting); pielīdzināšana reizi 12–16 nedēļās saglabā galus veselīgus. | ac16531e |  |
| long-one-length-blunt.client | Long hair cut to one clean, even edge. Simple to wear down or tie back. | Gari mati, kas nogriezti vienā taisnā, gludā līnijā. Viegli nēsāt izlaistus vai saņemt astē. | 54173a0d |  |
| long-one-length-blunt.stylist | Cut the perimeter with the client upright and the hair parted centrally. Check that the front pieces are not cut too short as shoulders can shorten them. Weight: a single weight line at the shoulder blade or mid-back. Invisible layers cut inside the weight line cannot be seen, so this look covers that request too. | Griez perimetru, klientam sēžot taisni un matiem esot sadalītiem ar celiņu vidū. Pārliecinies, ka priekšējās šķipsnas netiek nogrieztas par īsu, jo pleci tās var pacelt. Masa: viena izteikta masas līnija lāpstiņu līmenī vai muguras vidusdaļā. Neredzamās pakāpes zem masas līnijas nav redzamas, tāpēc šis griezums atbilst arī šādam lūgumam. | bbb52275 |  |
| long-u-layers.name | Long U-shape layers | Garais U veida pakāpeniskais griezums | f04a210c |  |
| long-u-layers.texture_fit.curly.note | cut dry and let curls shape the U | griez sausos matos un ļauj cirtām pašām izveidot U formu | b48207b8 |  |
| long-u-layers.texture_fit.coily.note | keep the U shallow for tight curls | sīkām cirtām veido lēzenāku U līniju | 92ce74c1 |  |
| long-u-layers.density_fit.low.note | fine hair looks thin at the ends if the U is deep | ja U līnija ir dziļa, smalki mati galos izskatīsies plāni | 2a59ea2f |  |
| long-u-layers.growth.note | Check the nape hair; a V-shaped nape will not hold a deep U. | Novērtē matus kakla zonā – ja matu augšanas līnija ir V veida, dziļa U forma neturēsies. | 710cec09 |  |
| long-u-layers.strand_note | Works with most strand sizes; very fine hair needs a shallow U. | Piemērots gandrīz jebkura biezuma matiem; ļoti smalkiem matiem nepieciešama lēzena U līnija. | 3a79e599 |  |
| long-u-layers.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| long-u-layers.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| long-u-layers.grow_out | The U grows out softly and holds its shape for 4-5 months. | U veida līnija ataug maigi un saglabā formu 4–5 mēnešus. | ac79daf5 |  |
| long-u-layers.client | A long cut with a gently curved back. It looks full from behind and easy to wear. | Garš griezums ar maigi noapaļotu mugurpuses līniju. No aizmugures tas izskatās kupls un ir viegli nēsājams. | 30a7f3d5 |  |
| long-u-layers.stylist | Shape the back in a gentle curve 6-8 cm longer at the centre than at the sides and cut long layers around the face to connect with the curve. Weight: back is a soft U with the middle longest. | Aizmugurē veido liektu līniju, kas centrā ir par 6–8 cm garāka nekā sānos, un izveido garas pakāpes ap seju, lai tās savienotos ar izliekumu. Masa: aizmugurē veidojas maiga U forma, vidusdaļā matiem esot visgarākajiem. | f504f731 |  |
| long-v-layers.name | Long V-shape layers | Garas V veida pakāpes | 8966392d |  |
| long-v-layers.texture_fit.curly.note | cut dry and keep the point shallow | griez sausos matos un V līniju veido lēzenu | 543cbac0 |  |
| long-v-layers.texture_fit.coily.note | tight curls make V points look sparse | sīku cirtu gadījumā V veida smaile var izskatīties reta | a5c7dd0d |  |
| long-v-layers.density_fit.low.note | fine hair looks thin at the point | smalkiem matiem V veida smaile izskatīsies plāna | e42ac18a |  |
| long-v-layers.density_fit.high.note | good for thick hair | piemērots bieziem matiem | 018982fa |  |
| long-v-layers.growth.note | A flat or low nape hairline does not hold a deep V, so keep the point shallow there. | Taisna vai zema matu augšanas līnija kakla zonā nenotur dziļu V formu, tāpēc veido spici lēzenāku. | 0b9916c2 |  |
| long-v-layers.strand_note | Thick, strong strands hold the point. | Biezi un spēcīgi mati vislabāk notur izteikto V līniju. | 3c2c07a3 |  |
| long-v-layers.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| long-v-layers.grow_out | The point softens in about 8 weeks as the sides grow past it, so re-point at each trim. | Aptuveni 8 nedēļu laikā spicums kļūst maigāks, jo sāni ataug pāri tam, tāpēc katrā pielīdzināšanas reizē V forma jāatjauno. | 4db46e3f |  |
| long-v-layers.client | A very long cut with a V-shaped back that makes the most of your length. The point makes the ends look full and tidy from behind. | Ļoti garš griezums ar V veida līniju mugurpusē, kas lieliski izceļ tavu matu garumu. Smailā līnija liek matu galiem no aizmugures izskatīties bieziem un koptiem. | 0e8675bb |  |
| long-v-layers.stylist | Cut the point at the centre of the back first, then angle the sides forward so the lengths meet in a clean V. Re-point the shape at each trim to keep it sharp. Weight: back comes to a defined point at the centre, with the sides shorter. | Vispirms izveido spici aizmugurē centrā, pēc tam virzi sānus uz priekšu leņķī, lai garumi satiktos precīzā V veidā. Katrā pielīdzināšanas reizē atjauno spici, lai tā saglabātos asa. Masa: aizmugurē centrā veidojas izteikts spicums, sāniem esot īsākiem. | 071ee541 |  |
| long-soft-face-frame.name | Long soft face-framing layers | Garas, maigas seju ierāmējošas pakāpes | c4f3fd29 |  |
| long-soft-face-frame.texture_fit.curly.note | cut dry and keep the face pieces 3-4 cm longer | griez sausos matos un seju ierāmējošās šķipsnas atstāj par 3–4 cm garākas | 0abfd1b9 |  |
| long-soft-face-frame.texture_fit.coily.note | cut dry and keep a long length for shrinkage | griez sausos matos un atstāj lielāku garumu, rēķinoties ar saraušanos | 4e1a1e93 |  |
| long-soft-face-frame.density_fit.low.note | fine hair needs fewer face layers | smalkiem matiem ap seju nepieciešams mazāk pakāpju | e131ff58 |  |
| long-soft-face-frame.growth.note | Check the front hairline and parting; a cowlick at the temple will push the face pieces forward. | Pārbaudi priekšējo matu augšanas līniju un celiņu – virpulis deniņos stums sejas šķipsnas uz priekšu. | d7de52ef |  |
| long-soft-face-frame.strand_note | Fine to medium strands move best around the face; very coarse hair can push the face pieces outward. | Smalki līdz vidēji biezi mati ap seju kustas visdabiskāk; ļoti raupji mati var spiest priekšējās šķipsnas uz āru. | dfe0b950 |  |
| long-soft-face-frame.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| long-soft-face-frame.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| long-soft-face-frame.grow_out | Grows out softly with no visible step, so trims can be spaced to every 12-14 weeks. | Ataug maigi un bez pamanāmām pārejām, tāpēc griezumu var atjaunot reizi 12–14 nedēļās. | 6b2c3591 |  |
| long-soft-face-frame.client | Long hair that keeps its length, with a few shorter pieces around the face that soften the look. | Gari mati, kas saglabā kopējo garumu, ar dažām īsākām šķipsnām ap seju, kas piešķir koptēlam maigumu. | 8557869c |  |
| long-soft-face-frame.stylist | Hold the perimeter level, then cut a V of face layers starting at the cheekbone and ending at the chin or collarbone. Point cut the face pieces to blend them into the length. Weight: length kept at the perimeter, with soft shorter layers around the face. | Saglabā perimetru vienā līmenī, tad izveido V veida pakāpes ap seju, sākot no vaigu kauliem un beidzot pie zoda vai atslēgas kaula. Apstrādā sejas šķipsnas ar point cut tehniku, lai tās sapludinātu ar kopējo garumu. Masa: garums saglabāts perimetrā, ar maigām, īsākām pakāpēm ap seju. | 76fc30ef |  |
| long-feathered.name | Long feathered layers | Garas filētas pakāpes | 520d2ebb |  |
| long-feathered.texture_fit.curly.note | cut dry, layers must stay long | griez sausos matos un pakāpes atstāj garas | 60821e90 |  |
| long-feathered.texture_fit.coily.note | needs blow-drying to flick; choose curly-u-shape-long-layers | jāveido ar fēnu, lai gali liektos uz āru; izvēlies curly-u-shape-long-layers | 68db9d3c |  |
| long-feathered.density_fit.low.note | fine hair loses the ends when feathered, keep a blunt base | smalkiem matiem filējums padara galus pārāk plānus, pamatlīniju saglabā taisnu | e9b14749 |  |
| long-feathered.growth.note | Side layers expose cowlicks at the temples. | Sānu pakāpes izceļ virpuļus deniņu zonā. | d463b339 |  |
| long-feathered.strand_note | Medium strands flick best; fine strands need volumising help. | Vidēja biezuma matiem gali liecas vislabāk; smalkiem matiem noderēs līdzekļi apjomam. | 603ab851 |  |
| long-feathered.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| long-feathered.upkeep.products.1 | flexible-hold spray | elastīgas fiksācijas matu laka | 089f6b1b |  |
| long-feathered.grow_out | The layers fade into a long layered style over about 12 weeks. | Aptuveni 12 nedēļu laikā pakāpes saplūst klasiskā garā pakāpeniskā griezumā. | 3c3f0be8 |  |
| long-feathered.client | A long cut with soft, feathered layers that flick away from the face. | Garu matu griezums ar maigām, filētām pakāpēm, kuru gali viegli liecas prom no sejas. | e8e84358 |  |
| long-feathered.stylist | Cut face layers on a diagonal back and carry them into the sides, finishing with point-cut ends. Weight: volume at the sides and crown, with feathered ends flicking away from the face. | Griez pakāpes ap seju pa diagonāli uz aizmuguri un savieno tās ar sāniem, galus apstrādājot ar point cut tehniku. Masa: apjoms sānos un galvvidū ar gaisīgiem, uz āru vērstiem galiem prom no sejas. | 123b1efa |  |
| long-curtain-layers.name | Long layers with a curtain fringe | Garas pakāpes ar aizkarveida priekšmatiem | a066f1b4 |  |
| long-curtain-layers.texture_fit.curly.note | cut dry and allow the fringe to spring | griez sausos matos un rēķinies ar priekšmatu atlēcienu | 0d399e1d |  |
| long-curtain-layers.texture_fit.coily.note | cut dry and allow the fringe to shrink | griez sausos matos un rēķinies ar priekšmatu saraušanos | e5c9d93d |  |
| long-curtain-layers.density_fit.low.note | fine hair looks sparse in the fringe | smalkiem matiem priekšmati var izskatīties reti | 75f42c56 |  |
| long-curtain-layers.growth.note | Check the front hairline for a cowlick before cutting the fringe. | Pirms priekšmatu griešanas pārbaudi, vai priekšējā matu augšanas līnijā nav virpuļa. | 1e773f6a |  |
| long-curtain-layers.strand_note | Medium strands drape best into a curtain parting; very thick strands need weight removed from the fringe. | Vidēja biezuma mati visglītāk ieguļas celiņā uz abām pusēm; ļoti bieziem matiem priekšmati ir jāparetina, noņemot smagumu. | d27144bc |  |
| long-curtain-layers.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| long-curtain-layers.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| long-curtain-layers.grow_out | The fringe grows into face-framing layers in 8-12 weeks. | 8–12 nedēļu laikā priekšmati ataug par seju ierāmējošām pakāpēm. | 28da95f7 |  |
| long-curtain-layers.client | Long layers past the shoulder blades with a centre-parted curtain fringe that blends into the sides. | Garas pakāpes pāri lāpstiņām ar vidū pašķirtiem aizkarveida priekšmatiem, kas sānos nemanāmi saplūst ar pārējiem matiem. | 5aaa91f1 |  |
| long-curtain-layers.stylist | Cut a triangle section at the front, taper the fringe to the cheekbone and blend into the side layers. Weight: long layers, with a centre-parted curtain fringe that melts into the sides. | Priekšpusē izdali trīsstūrveida sekciju, pagarini priekšmatus līdz vaigu kauliem un sapludini ar sānu pakāpēm. Masa: garas pakāpes ar vidū šķirtiem aizkarveida priekšmatiem, kas plūstoši saplūst ar sāniem. | 0bed612e |  |
| hime-cut.name | Hime cut | Hime griezums | f725724f |  |
| hime-cut.texture_fit.wavy.note | works with soft waves if the side panels are blow-dried smooth | piestāv arī viegli viļņainiem matiem, ja sānu šķipsnas ar fēnu izžāvē gludas | 642b9b72 |  |
| hime-cut.texture_fit.curly.note | side panels fight the curl | sānu šķipsnas pretosies cirtām | 456d5c70 |  |
| hime-cut.texture_fit.coily.note | straight panels need daily heat on coils; see coily-length-preserving-layers | taisnajām šķipsnām uz sīkām cirtām būs vajadzīga ikdienas taisnošana ar karstumu; skaties coily-length-preserving-layers | 6a98a098 |  |
| hime-cut.density_fit.low.note | fine hair loses density at the short sides | smalkiem matiem īsajās sānu šķipsnās pietrūkst biezuma | 133cfd8e |  |
| hime-cut.growth.note | Side panels start at the temple; check that the hairline allows a clean panel. | Sānu šķipsnas sākas pie deniņiem; pārbaudi, vai matu augšanas līnija ļauj izveidot precīzu šķipsnu. | 60aad2e3 |  |
| hime-cut.strand_note | Straight, medium to thick strands hold the panels; wavy hair needs blow-drying. | Taisni, vidēji biezi līdz biezi mati vislabāk notur šķipsnu formu; viļņainiem matiem nepieciešama veidošana ar fēnu. | de5e6504 |  |
| hime-cut.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| hime-cut.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| hime-cut.grow_out | The side panels grow into face-framing layers after about 4 months. | Pēc aptuveni 4 mēnešiem sānu šķipsnas ataug par seju ierāmējošām pakāpēm. | f93bd6cd |  |
| hime-cut.client | A long cut with straight cheek-length side pieces and a straight fringe. | Gari mati ar taisnām šķipsnām vaigu kaulu garumā un taisniem priekšmatiem. | 943bf28b |  |
| hime-cut.stylist | Disconnect the side panels at the cheekbone or jaw, keep the back long and blunt and cut the fringe straight across. Weight: straight long back with shorter, cheek-length side panels and a straight fringe. | Veido atdalītas sānu šķipsnas vaigu kaulu vai žokļa līnijā, aizmuguri atstāj garu un taisnu, bet priekšmatus nogriez taisni pāri pierei. Masa: taisna, gara aizmugure ar īsākām sānu šķipsnām vaigu līmenī un taisniem priekšmatiem. | 0c47eeab |  |
| jellyfish-cut.name | Jellyfish cut | Jellyfish griezums | 3fc16920 |  |
| jellyfish-cut.texture_fit.curly.note | cut dry and keep the upper layer longer | griez sausos matos un augšējo kārtu atstāj garāku | f4cad5b2 |  |
| jellyfish-cut.texture_fit.coily.note | the upper layer pulls into a puff | augšējā kārta var savilkties apaļā apjomā | 6931d044 |  |
| jellyfish-cut.density_fit.low.note | fine hair looks thin in the lower layer, so keep the base blunt | smalkiem matiem apakšējā kārta izskatīsies pārāk plāna, tāpēc pamatlīniju atstāj taisnu | 2616e443 |  |
| jellyfish-cut.growth.note | The short upper layer sits on the crown and exposes any cowlick or double crown there, so check before choosing its length. | Īsais augšējais slānis atrodas virsgalvī un izceļ jebkuru virpuli vai dubulto virpuli, tāpēc pirms garuma izvēles to pārbaudi. | d98b364e |  |
| jellyfish-cut.strand_note | Medium to thick strands support the contrast between the two levels. | Vidēji līdz biezi mati vislabāk izceļ kontrastu starp abiem līmeņiem. | b1ca9c42 |  |
| jellyfish-cut.upkeep.products.0 | texturising spray | teksturējošs sprejs | 1544201e |  |
| jellyfish-cut.upkeep.products.1 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| jellyfish-cut.grow_out | The upper layer grows into long layers over 3-4 months. | Augšējais slānis 3–4 mēnešu laikā pāraug garās pakāpēs. | a4dee27a |  |
| jellyfish-cut.client | A bold two-level cut with a short, rounded top layer and long hair underneath. | Drosmīgs divu līmeņu griezums ar īsu, noapaļotu virsējo kārtu un gariem matiem apakšā. | d6d1fd09 |  |
| jellyfish-cut.stylist | Section off a circle from the crown to the cheek and cut it short and rounded, leaving the lower layer long, with a visible disconnection. Weight: rounded short upper layer floating above a long, thin lower layer. | Izdali apli no virsgalva līdz vaigam un nogriez to īsu un noapaļotu, atstājot apakšējo slāni garu, ar pamanāmu atdalījumu. Masa: noapaļots, īss augšējais slānis virs gara, plāna apakšējā slāņa. | 91150c09 |  |
| wavy-cascade-layers.name | Wavy cascade layers | Kaskādes pakāpes viļņainiem matiem | 1ec27650 |  |
| wavy-cascade-layers.texture_fit.curly.note | cut dry or damp in the wave pattern | griezt sausos vai mitros matos, ievērojot viļņu kritumu | 5e1d6ade |  |
| wavy-cascade-layers.texture_fit.coily.note | tight curls need 8-10 cm extra length to fall as waves | izteiktām cirtām vajag 8–10 cm papildu garuma, lai tās kristu viļņos | a06b0b52 |  |
| wavy-cascade-layers.density_fit.high.note | thick waves benefit from more interior layers | bieziem viļņainiem matiem noder vairāk iekšējo pakāpju | 5623d962 |  |
| wavy-cascade-layers.growth.note | Check the crown and nape because waves exaggerate any whorl. | Pārbaudi virsgalvi un matus pie kakla, jo viļņi izceļ jebkuru virpuli. | 9c2c3f71 |  |
| wavy-cascade-layers.strand_note | Fine to medium waves show the pattern. Thick waves spread without work on the inside. | Smalkiem līdz vidēji bieziem matiem viļņu raksts būs labi redzams. Bieziem viļņainiem matiem vajadzīga retināšana no iekšpuses, lai tie neizplestos uz āru. | c2a1123f |  |
| wavy-cascade-layers.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| wavy-cascade-layers.upkeep.products.1 | curl cream | loku krēms | a180aed0 |  |
| wavy-cascade-layers.grow_out | The cascade grows out with no obvious step and needs trims only every 12-14 weeks. | Kaskāde ataug bez redzamām pārejām, un matu gali jāpielīdzina tikai reizi 12–14 nedēļās. | 2de701a8 |  |
| wavy-cascade-layers.client | Long, wavy hair with soft layers that shape the waves. Easy to air-dry. | Gari, viļņaini mati ar maigām pakāpēm, kas izceļ viļņus. Viegli žāvēt dabiski. | aab1efc6 |  |
| wavy-cascade-layers.stylist | Cut long layers in the wave pattern and avoid short layers at the crown. Slide cut the ends lightly. Weight: long layers cut in the wave pattern, with weight kept in the lower third. | Veido garas pakāpes pēc viļņu zīmējuma un izvairies no īsām pakāpēm virsgalvī. Galus viegli apstrādā ar slīdošo griezumu (slide cut). Masa: garas pakāpes, kas grieztas pēc viļņu zīmējuma, ar saglabātu biezumu apakšējā trešdaļā. | 70dd145d |  |
| thick-hair-long-layers.name | Long layers for thick hair | Garas pakāpes bieziem matiem | 76d26bb7 |  |
| thick-hair-long-layers.texture_fit.curly.note | cut dry and keep thinning inside the lengths | griez sausos matos un filē tikai no iekšpuses matu garumā | 958112a7 |  |
| thick-hair-long-layers.texture_fit.coily.note | do not thin near the roots | nefilē tuvu pie saknēm | 74c05172 |  |
| thick-hair-long-layers.density_fit.low.note | too little density to remove weight | matiem par maz biezuma, lai noņemtu smagumu | 4d65d8f2 |  |
| thick-hair-long-layers.density_fit.medium.note | medium density needs only a light touch | vidējam biezumam vajadzīga tikai pavisam viegla retināšana | 2b24a1df |  |
| thick-hair-long-layers.growth.note | Avoid thinning around crown whorls, because short hairs will stand up. | Izvairies no retināšanas ap virpuļiem virsgalvī, jo īsie mati celsies stāvus. | 1227a907 |  |
| thick-hair-long-layers.strand_note | Designed for dense, thick or coarse strands that swell outward. | Paredzēts bieziem, raupjiem vai blīviem matiem, kas mēdz pūkoties un izplesties uz āru. | 8680c1bd |  |
| thick-hair-long-layers.upkeep.products.0 | smoothing cream | nogludinošs krēms | 16bbc1bd |  |
| thick-hair-long-layers.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| thick-hair-long-layers.grow_out | Grows out slowly with the weight reduction intact for about 12 weeks. | Ataug lēnām, un noņemtais biezums saglabā savu efektu aptuveni 12 nedēļas. | a8d2abd5 |  |
| thick-hair-long-layers.client | A long cut for thick hair that removes weight and dries faster. | Griezums gariem, bieziem matiem, kas noņem lieko smagumu un žūst daudz ātrāk. | fdfb6edb |  |
| thick-hair-long-layers.stylist | Slide cut or channel the interior in mid-lengths, leaving the outer layer untouched, and cut weight out behind the ears and at the nape. Weight: interior weight removed through channels, with a dense outline kept at the ends. | Izmanto slīdošo griezumu vai veido iekšējos kanālus matu vidusdaļā, virsējo slāni atstājot neskartu, un noņem biezumu aiz ausīm un pie kakla. Masa: iekšējais biezums noņemts ar kanāliem, matu galos saglabājot blīvu kontūru. | a8d14383 |  |
| long-a-line-shape.name | Long A-line shape | Gars A-līnijas griezums | 44c52150 |  |
| long-a-line-shape.texture_fit.curly.note | cut dry and soften the diagonal for curls | griez sausos matos un cirtām veido maigāku diagonālo līniju | e48dfe16 |  |
| long-a-line-shape.texture_fit.coily.note | keep the line gentle to avoid a hard step | veido lēzenu līniju, lai neveidotos ass pakāpiens | 42e3657e |  |
| long-a-line-shape.density_fit.low.note | fine hair looks sparse at the nape, keep the back blunt | smalkiem matiem pakausis izskatīsies par retu, tāpēc aizmugurē saglabā taisnu līniju | 63c72815 |  |
| long-a-line-shape.growth.note | A shorter back exposes the nape growth pattern, so look at the whorl before shortening. | Īsāka aizmugure atsedz matu augšanas virzienu pie kakla, tāpēc pirms saīsināšanas apskati virpuli. | 2a80eb51 |  |
| long-a-line-shape.strand_note | Smooth strands of medium weight show the slope best. Curly hair makes the angle harder to see. | Gludiem, vidēji bieziem matiem slīpā līnija izskatās vislabāk. Cirtainos matos šo leņķi pamanīt būs grūtāk. | f9260241 |  |
| long-a-line-shape.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| long-a-line-shape.upkeep.products.1 | light oil | viegla eļļa | 7170b5ea |  |
| long-a-line-shape.grow_out | Lengthen the back and the line flattens into one-length over about 4 months, with no awkward step. | Ataudzējot aizmuguri, līnija apmēram 4 mēnešu laikā izlīdzinās vienā garumā bez nepatīkamām pārejām. | caeb61e9 |  |
| long-a-line-shape.client | Long hair that is cut so the front falls a little longer than the back, giving a narrow angled line. | Gari mati ar pagarinājumu uz priekšu, veidojot slaidu un pamanāmu leņķi. | 949d9e48 |  |
| long-a-line-shape.stylist | Carry a gentle diagonal forward from the nape, with the front 6-10 cm longer than the back. Soften the corner with point cutting so no hard step shows when the hair is worn back. Weight: back is shorter than the front, with a diagonal line from the nape to the front. | Veido maigu diagonāli no kakla uz priekšu, priekšējos matus atstājot par 6-10 cm garākus nekā aizmugurē. Mīkstini stūri ar point cutting, lai, atglaužot matus atpakaļ, nebūtu redzama asa pāreja. Masa: aizmugure ir īsāka par priekšpusi, veidojot diagonālu līniju no kakla uz priekšu. | 8b7f03c9 |  |
| curly-u-shape-long-layers.name | Curly U-shape long layers | U veida garās pakāpes cirtainiem matiem | 01a774f2 |  |
| curly-u-shape-long-layers.texture_fit.straight.note | straight hair needs a different layering plan | taisniem matiem vajadzīgs citāds pakāpju griezums | c9597c67 |  |
| curly-u-shape-long-layers.texture_fit.coily.note | keep the U shallow and cut dry on tighter coils | sīkākām cirtām U formu veido seklāku un griez sausos matos | 3ebe2fb1 |  |
| curly-u-shape-long-layers.density_fit.low.note | fine curls look thin at the ends, so layer lightly | smalkām cirtām gali izskatīsies par plāniem, tāpēc veido tikai vieglas pakāpes | 8b832d3b |  |
| curly-u-shape-long-layers.growth.note | Check the nape and crown, as curls spiral around whorls. | Pārbaudi matus pie kakla un virsgalvī, jo lokas ap virpuļiem vērpjas spirālē. | abd0b571 |  |
| curly-u-shape-long-layers.strand_note | Curl density determines how deep the U can be; thick curls handle more layering. | Cirtu biezums nosaka, cik dziļa var būt U forma; biezākas cirtas pieļauj izteiktākas pakāpes. | 84ec4e45 |  |
| curly-u-shape-long-layers.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-u-shape-long-layers.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| curly-u-shape-long-layers.grow_out | Grows out with almost no visible step, so only the ends need a trim every 3 months. | Ataug gandrīz bez pamanāmām pārejām, tāpēc tikai reizi 3 mēnešos nepieciešams pielīdzināt matu galus. | 9a515e5f |  |
| curly-u-shape-long-layers.client | Curls that land at the shoulders when dry, with soft layers that stop them from forming a triangle. Pulled straight, they reach the shoulder blades. | Cirtas, kas sausas sniedzas līdz pleciem, ar maigām pakāpēm, kas neļauj tām iegūt trīsstūra formu. Izstieptā veidā tās sniedzas līdz lāpstiņām. | 54449f5c |  |
| curly-u-shape-long-layers.stylist | Cut dry, curl by curl, with the shortest layers at the top, and keep the back length gently rounded. Weight: long layers shaped into a U so the curls stack evenly instead of forming a triangle. Tight coils shrink more and land nearer the collarbone. | Griez sausos matos, loku pa lokai, īsākās pakāpes veidojot virspusē, un aizmugures garumu saglabā maigi noapaļotu. Masa: garas pakāpes U formā, lai lokas gultos vienmērīgi un neveidotu trīsstūri. Sīkas cirtas sarausies vairāk un sniegsies tuvāk atslēgas kaulam. | e3b56f1a |  |
| coily-length-preserving-layers.name | Length-preserving coily layers | Garumu saglabājošas pakāpes sīkām cirtām | 447f8cbd |  |
| coily-length-preserving-layers.texture_fit.curly.note | needs curls or texture-friendly styling | vajadzīgas izteiktas cirtas vai tekstūrai piemērota ieveidošana | 3a5814f7 |  |
| coily-length-preserving-layers.density_fit.low.note | fine coils look thin at the ends, so keep layers few and long | smalkām, sīkām cirtām gali izskatīsies par plāniem, tāpēc veido mazāk pakāpju un saglabā tās garākas | 6b1b5aad |  |
| coily-length-preserving-layers.growth.note | Check whorls at the crown and nape; coils follow them closely. | Pārbaudi virpuļus virsgalvī un pie kakla — sīkās cirtas tiem izteikti seko. | df8b2bd9 |  |
| coily-length-preserving-layers.strand_note | Coily strands are fragile; light layers reduce tangling and retain length. | Sīkas cirtas ir trauslas; vieglas pakāpes mazina pinkāšanos un palīdz saglabāt garumu. | 160c2ef1 |  |
| coily-length-preserving-layers.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| coily-length-preserving-layers.upkeep.products.1 | styling cream | ieveidošanas krēms | 01654a1c |  |
| coily-length-preserving-layers.grow_out | Grows out with minimal change; only the ends need regular trims. | Ataug, gandrīz nemainot formu; tikai regulāri jāapgriež gali. | 3f14ff33 |  |
| coily-length-preserving-layers.client | Natural coils kept as long as they can be, with light shaping. Pulled straight they reach the shoulder blades, but dry they land between the jaw and the collarbone. | Dabiskas, sīkas cirtas ar maksimāli saglabātu garumu un vieglu formu. Izstieptā veidā tās sniedzas līdz lāpstiņām, bet sausas krīt starp žokļa līniju un atslēgas kaulu. | 2437eb22 |  |
| coily-length-preserving-layers.stylist | Use shallow layers and avoid short pieces; trim split ends in sections. Weight: very long, shallow layers that keep as much length as possible. | Veido lēzenas pakāpes un izvairies no īsām šķipsnām; šķeltos galus apgriez pa sekcijām. Masa: ļoti garas, lēzenas pakāpes, kas maksimāli saglabā matu garumu. | 5efe3e66 |  |
| coily-length-preserving-layers.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| curly-face-frame-length.name | Curly face-framing cut | Seju ierāmējošs griezums cirtainiem matiem | 6d16fd60 |  |
| curly-face-frame-length.texture_fit.wavy.note | waves need styling | viļņainiem matiem vajadzīga ieveidošana | 2ae4dbde |  |
| curly-face-frame-length.growth.note | The front hairline decides how the pieces fall; check cowlicks. | Priekšējā matu augšanas līnija nosaka to, kā kritīs šķipsnas; pārbaudi virpuļus. | 7e03bbaf |  |
| curly-face-frame-length.strand_note | Works across densities because only the front is cut. | Piemērots jebkura biezuma matiem, jo tiek griezti tikai priekšējie mati ap seju. | d80e71e3 |  |
| curly-face-frame-length.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-face-frame-length.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| curly-face-frame-length.grow_out | The front pieces grow into long layers over about 3 months with no visible step. | Priekšējās šķipsnas apmēram 3 mēnešu laikā pāraug garās pakāpēs bez pamanāmas pārejas. | aa038969 |  |
| curly-face-frame-length.client | Curls kept at full length, landing at the shoulders when dry, with a few shorter curls around the face to frame it. Pulled straight, they reach the shoulder blades. | Pilna garuma cirtas, kas sausas sniedzas līdz pleciem, ar īsākām šķipsnām sejas ierāmēšanai. Izstieptā veidā tās sniedzas līdz lāpstiņām. | f6e40ef0 |  |
| curly-face-frame-length.stylist | Cut dry in small curl clusters, shaping only the front section from the cheekbone to the chin; leave the rest of the length untouched. Check the face pieces after the curls settle. Weight: length kept at the back with short curls only around the face. Tight coils shrink more and land nearer the collarbone. | Griez sausos matos nelielās loku grupās, veidojot tikai priekšējo daļu no vaigu kaula līdz zodam; pārējo garumu atstāj neskartu. Pārbaudi šķipsnas ap seju, kad lokas ir iegūlušās. Masa: aizmugurē saglabāts garums, ar īsākām lokām tikai ap seju. Sīkas cirtas sarausies vairāk un sniegsies tuvāk atslēgas kaulam. | 105b6538 |  |
| curly-bangs-long-curls.name | Long curls with a curly fringe | Gari cirtaini mati ar cirtainiem priekšmatiem | 5155d862 |  |
| curly-bangs-long-curls.texture_fit.wavy.note | waves need blow-drying for the fringe | viļņainiem matiem priekšmati būs jāfēno | e723d386 |  |
| curly-bangs-long-curls.density_fit.low.note | fine curls make a sparse fringe, so cut it fuller | smalkas cirtas priekšmatus padara retus, tāpēc griez tos biezākus | b46b38fe |  |
| curly-bangs-long-curls.growth.note | A front cowlick strongly affects a curly fringe. | Virpulis priekšpusē būtiski ietekmē cirtainus priekšmatus. | 1f552629 |  |
| curly-bangs-long-curls.strand_note | The fringe curl pattern decides the final length; test how it springs before cutting. | Priekšmatu galīgo garumu nosaka cirtu raksts; pirms griešanas pārbaudi, cik ļoti cirta atlēks atpakaļ. | f234782e |  |
| curly-bangs-long-curls.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-bangs-long-curls.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| curly-bangs-long-curls.grow_out | The fringe grows into curtain-length curls in 8-12 weeks. | Priekšmati 8-12 nedēļu laikā ataug līdz aizkarveida loku garumam. | bb3708aa |  |
| curly-bangs-long-curls.client | Curls that land at the shoulders when dry, with a short, springy curly fringe. Pulled straight, they reach the shoulder blades. | Cirtas, kas sausas sniedzas līdz pleciem, ar īsiem, atsperīgiem cirtainiem priekšmatiem. Izstieptā veidā tās sniedzas līdz lāpstiņām. | 711fa9d8 |  |
| curly-bangs-long-curls.stylist | Cut the fringe dry, curl by curl, about 3 cm longer than the target to allow for shrinkage. Weight: long layered curls with a short curly fringe above the brows. Tight coils shrink more and land nearer the collarbone. | Griez priekšmatus sausos matos, loku pa lokai, apmēram 3 cm garākus par vēlamo garumu, lai ņemtu vērā saraušanos. Masa: garas, pakāpeniskas lokas ar īsiem cirtainiem priekšmatiem virs uzacīm. Sīkas cirtas sarausies vairāk un sniegsies tuvāk atslēgas kaulam. | 4cc9901a |  |
| bottleneck-bang-long-layers.name | Bottleneck fringe on long layers | Garas pakāpes ar bottleneck priekšmatiem | 85012256 |  |
| bottleneck-bang-long-layers.texture_fit.curly.note | cut the fringe dry and allow for spring | priekšmatus griez sausos matos un rēķinies ar cirtas atlēcienu | df62978d |  |
| bottleneck-bang-long-layers.texture_fit.coily.note | cut dry; see Curly curtain-fringe shoulder cut | griez sausos matos; skatīt Curly curtain-fringe shoulder cut | 0b189bca |  |
| bottleneck-bang-long-layers.density_fit.low.note | fine hair looks sparse in a wide fringe, so keep it short and full | smalkiem matiem plati priekšmati izskatīsies par retiem, tāpēc veido tos īsākus un biezākus | 95b40211 |  |
| bottleneck-bang-long-layers.growth.note | The fringe starts further back on the head and needs a calm front hairline. | Priekšmati sākas tālāk virzienā uz virsgalvi, un tiem nepieciešama mierīga priekšējā matu augšanas līnija. | cc59d2d9 |  |
| bottleneck-bang-long-layers.strand_note | Medium strands hold the shape of the fringe; fine strands may separate. | Vidēji biezi mati labi notur priekšmatu formu; smalki mati var sadalīties šķipsnās. | e54146cd |  |
| bottleneck-bang-long-layers.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| bottleneck-bang-long-layers.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| bottleneck-bang-long-layers.grow_out | The fringe grows into a curtain fringe in about 8 weeks. | Priekšmati apmēram 8 nedēļu laikā pārtop par aizkarveida priekšmatiem. | 68c6b403 |  |
| bottleneck-bang-long-layers.client | Long hair with a fringe that curves around the face like a bottle. | Gari mati ar priekšmatiem, kas maigi izliecas ap seju kā pudeles kakliņš. | cef27308 |  |
| bottleneck-bang-long-layers.stylist | Take a triangle section at the front hairline, keep the centre shortest at the lashes and angle the sides longer towards the cheekbones. Weight: long layers with a fringe that is short in the centre and widens into longer side pieces. | Izdali trīsstūrveida sekciju pie priekšējās matu augšanas līnijas, centru griez visīsāko skropstu līmenī un sānu daļas pagarini leņķī pret vaigu kauliem. Masa: garas pakāpes ar priekšmatiem, kas vidū ir īsi un pāriet garākās sānu šķipsnās. | 8bf04c39 |  |
| wispy-brow-fringe-long.name | See-through fringe on long layers | Garas pakāpes ar gaisīgiem priekšmatiem | d13fdd85 |  |
| wispy-brow-fringe-long.texture_fit.curly.note | cut the fringe dry and leave extra length for spring | priekšmatus griez sausos matos un atstāj garākus, rēķinoties ar cirtas atlēcienu | 1edab4bc |  |
| wispy-brow-fringe-long.texture_fit.coily.note | wispy edges disappear into curls | gaisīgie galiņi pazudīs cirtās | 6e07c5c6 |  |
| wispy-brow-fringe-long.density_fit.low.note | fine hair looks very transparent, so keep a little density | smalkiem matiem priekšmati izskatīsies pavisam caurspīdīgi, tāpēc saglabā nedaudz biezuma | 00202e62 |  |
| wispy-brow-fringe-long.density_fit.high.note | thin the fringe lightly | viegli izfilē priekšmatus | 3797280c |  |
| wispy-brow-fringe-long.growth.note | Needs a stable front hairline and no strong cowlick. | Nepieciešama stabila priekšējā matu augšanas līnija bez izteiktiem virpuļiem. | 1155c958 |  |
| wispy-brow-fringe-long.strand_note | Fine to medium straight or wavy strands make the see-through finish. Thick or curly hair looks dense and needs thinning. | Smalki līdz vidēji biezi taisni vai viļņaini mati rada šo gaisīgo efektu. Biezi vai cirtaini mati izskatās pārāk biezi un būs jāparetina. | 9233fd9a |  |
| wispy-brow-fringe-long.upkeep.products.0 | dry shampoo | sausais šampūns | 0aaae6ea |  |
| wispy-brow-fringe-long.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| wispy-brow-fringe-long.grow_out | The fringe grows out into a curtain fringe. | Priekšmati ataugot pārtop par aizkarveida priekšmatiem. | f1d90091 |  |
| wispy-brow-fringe-long.client | Long hair with a thin, soft fringe that skims the brows. Easy, French and a little undone. | Gari mati ar viegliem, maigi krītošiem priekšmatiem līdz uzacīm. Brīvs, franciski šiks un mazliet nevērīgs tēls. | e9607b54 |  |
| wispy-brow-fringe-long.stylist | Cut a narrow fringe, point cut the ends for a see-through texture and leave the rest of the length untouched. Weight: long natural lengths with a thin, see-through fringe skimming the brows. | Izgriez šaurus priekšmatus, galus veido ar point cutting gaisīgai tekstūrai, bet pārējo matu garumu atstāj neskartu. Masa: dabisks matu garums ar plāniem, gaisīgiem priekšmatiem, kas viegli skar uzacis. | ed87944e |  |
| side-swept-fringe-long-layers.name | Side-swept fringe on long layers | Garas pakāpes ar slīpajiem priekšmatiem | 6c52a288 |  |
| side-swept-fringe-long-layers.texture_fit.curly.note | cut dry and allow for spring | griez sausos matos un rēķinies ar cirtas atlēcienu | d8913633 |  |
| side-swept-fringe-long-layers.texture_fit.coily.note | cut dry; see Curly curtain-fringe shoulder cut | griez sausos matos; skatīt Curly curtain-fringe shoulder cut | 0b189bca |  |
| side-swept-fringe-long-layers.density_fit.low.note | fine hair looks flat, so add volume | smalki mati izskatās pieglausti, tāpēc piešķir tiem apjomu | 4dfb4126 |  |
| side-swept-fringe-long-layers.growth.note | The fringe follows the part; check the natural parting. | Priekšmati seko celiņam; pārbaudi dabisko matu celiņu. | d0e8ce98 |  |
| side-swept-fringe-long-layers.strand_note | Strands of medium weight carry the long slope. Very fine strands need root lift so the sweep does not fall flat. | Vidēji biezi mati labi notur slīpo līniju. Ļoti smalkiem matiem vajadzīgs pacēlums pie saknēm, lai tie nekristu pieglausti. | 022a22c0 |  |
| side-swept-fringe-long-layers.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| side-swept-fringe-long-layers.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| side-swept-fringe-long-layers.grow_out | The fringe blends into the side layers within about 8 weeks, with no awkward length stage. | Priekšmati apmēram 8 nedēļu laikā saplūst ar sānu pakāpēm bez neērta pārejas posma. | 1cb75a43 |  |
| side-swept-fringe-long-layers.client | Long hair with a long fringe that sweeps to the side. | Gari mati ar pagarinātiem priekšmatiem, kas skaisti krīt uz vienu sānu. | fe305c7e |  |
| side-swept-fringe-long-layers.stylist | Cut a long diagonal from the part to the cheekbone and blend it into the side layers. Weight: long layers with a long fringe that sweeps across the forehead from a side part. | Griez garu diagonāli no celiņa līdz vaigu kaulam un iepludini to sānu pakāpēs. Smagums: garas pakāpes ar gariem priekšmatiem, kas no sānu celiņa slīpi klājas pāri pierei. | eadfd3a6 |  |
| baby-bangs-long-hair.name | Baby fringe on long hair | Gari mati ar baby priekšmatiem | 6946b0ae |  |
| baby-bangs-long-hair.texture_fit.curly.note | the fringe springs and shrinks | priekšmati atlēks un sarausies | 06e76697 |  |
| baby-bangs-long-hair.texture_fit.coily.note | a micro fringe shrinks to the hairline on coils; see curly-bangs-long-curls | uz sīkām cirtām mikro priekšmati saraujas līdz pat matu augšanas līnijai; skatīt curly-bangs-long-curls | b389f0b0 |  |
| baby-bangs-long-hair.density_fit.low.note | fine hair makes a sparse fringe, so keep it dense | smalkiem matiem priekšmati izskatās reti, tāpēc veido tos biezākus | a1f11994 |  |
| baby-bangs-long-hair.density_fit.high.note | thin lightly | viegli paretini | ccb3af7e |  |
| baby-bangs-long-hair.growth.note | The fringe needs a calm hairline; a front cowlick will lift it. | Priekšmatiem vajadzīga mierīga matu augšanas līnija; virpulis pie pieres tos pacels uz augšu. | 135c49f2 |  |
| baby-bangs-long-hair.strand_note | Straight, smooth strands give the cleanest micro fringe; waves make the length difficult to control. | Taisni, gludi mati veido visprecīzāko mikropriekšmatu līniju; viļņainos matos garumu būs grūti kontrolēt. | 78f2ad59 |  |
| baby-bangs-long-hair.upkeep.products.0 | light wax | viegls vasks | 94347f09 |  |
| baby-bangs-long-hair.grow_out | The fringe grows to brow length in about 6 weeks. | Priekšmati līdz uzacu garumam ataug apmēram 6 nedēļās. | c4149619 |  |
| baby-bangs-long-hair.client | Long hair with a tiny fringe at the hairline. Very graphic and playful. | Gari mati ar pavisam īsiem priekšmatiem pie matu augšanas līnijas. Grafisks un rotaļīgs tēls. | 71a9cf14 |  |
| baby-bangs-long-hair.stylist | Cut the micro fringe dry, a little at a time, measuring at the natural hairline; take no more than 2-3 cm in the first pass. Keep the rest of the length untouched to make the contrast. Weight: one-length long hair with a micro fringe at the hairline. | Griez mikro priekšmatus sausos matos, pamazām, ņemot vērā dabisko matu augšanas līniju; pirmajā piegājienā nenoņem vairāk par 2-3 cm. Pārējo garumu atstāj neskartu, lai radītu kontrastu. Smagums: viena garuma gari mati ar mikro priekšmatiem pie matu augšanas līnijas. | cecc8917 |  |
| blunt-full-fringe-long.name | Long hair with blunt full fringe | Gari mati ar bieziem, taisniem priekšmatiem | fa54d548 |  |
| blunt-full-fringe-long.texture_fit.wavy.note | blow-dry the fringe flat | izfēno priekšmatus taisnus | dacaac3b |  |
| blunt-full-fringe-long.texture_fit.curly.note | a blunt fringe springs up on curls; see curly-bangs-long-curls | cirtainos matos taisni priekšmati atlēks uz augšu; skatīt curly-bangs-long-curls | 5275fd6e |  |
| blunt-full-fringe-long.texture_fit.coily.note | a blunt fringe shrinks to the hairline on coils; see curly-bangs-long-curls | sīkās cirtās taisni priekšmati sarausies līdz matu augšanas līnijai; skatīt curly-bangs-long-curls | db404be8 |  |
| blunt-full-fringe-long.density_fit.low.note | fine hair looks sparse in the fringe | smalkiem matiem priekšmati var izskatīties reti | 75f42c56 |  |
| blunt-full-fringe-long.growth.note | Needs a stable front hairline; a crown cowlick or strong whorl makes a blunt fringe split or lift. | Nepieciešama stabila matu augšanas līnija pie pieres; virpulis virsgalvī vai spēcīgs matu virpulis liks taisnajiem priekšmatiem šķirties vai pacelties. | 2c48610a |  |
| blunt-full-fringe-long.strand_note | Straight strands of medium weight give the cleanest fringe line. Very fine strands look see-through and very coarse strands push forward. | Taisni, vidēja biezuma mati veido visprecīzāko priekšmatu līniju. Ļoti smalki mati izskatās caurspīdīgi, bet ļoti rupji mati spurojas uz priekšu. | 063d6276 |  |
| blunt-full-fringe-long.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| blunt-full-fringe-long.upkeep.products.1 | dry shampoo | sausais šampūns | 0aaae6ea |  |
| blunt-full-fringe-long.grow_out | The fringe reaches the eyes within about 3 weeks, so most clients grow it into a curtain fringe over 8-10 weeks. | Priekšmati sasniedz acis apmēram 3 nedēļu laikā, tāpēc lielākā daļa klientu 8-10 nedēļu laikā tos ataudzē par aizkaru priekšmatiem. | 2e7f4ea7 |  |
| blunt-full-fringe-long.client | Long, sleek hair with a heavy straight fringe across the brows. Bold and graphic, and it draws the eye. | Gari, gludi mati ar bieziem, taisniem priekšmatiem līdz uzacīm. Drosmīgs un grafisks tēls, kas piesaista skatienu. | 1f5b1f1e |  |
| blunt-full-fringe-long.stylist | Section a wide triangle from about 3 cm behind the hairline, cut the fringe dry and straight at the brow, then point cut the edge slightly to soften it. Keep the long lengths one-length to preserve the contrast. Weight: one-length long hair with a thick, straight-across fringe. | Izdali platu trīsstūri apmēram 3 cm aiz matu augšanas līnijas, griez priekšmatus sausos matos taisni uzacu līmenī, tad ar point cut tehniku nedaudz mīkstini malu. Pārējos matus atstāj vienā garumā, lai saglabātu kontrastu. Smagums: viena garuma gari mati ar bieziem, taisniem priekšmatiem. | fb45defb |  |
| long-hidden-undercut.name | Long hair with hidden undercut | Gari mati ar slēpto undercut | 6913bacc |  |
| long-hidden-undercut.texture_fit.curly.note | cut the undercut carefully on curls and keep it short | cirtainos matos undercut veido uzmanīgi un atstāj to īsu | 5d2f359f |  |
| long-hidden-undercut.texture_fit.coily.note | keep the undercut tight on coils | sīkām cirtām undercut veido pavisam īsu | c5a263f3 |  |
| long-hidden-undercut.density_fit.low.note | fine hair lacks density for an undercut | smalkiem matiem nepietiek biezuma undercut griezumam | d18ecd2c |  |
| long-hidden-undercut.density_fit.medium.note | medium hair needs only a small undercut | vidēji bieziem matiem pietiek ar nelielu undercut zonu | 41ce03cd |  |
| long-hidden-undercut.growth.note | The undercut should follow the nape hairline, including any whorls. | Undercut zonai jāseko matu augšanas līnijai pie kakla, ņemot vērā visus virpuļus. | 2fa6146d |  |
| long-hidden-undercut.strand_note | Very thick, dense or coarse strands benefit; the long length covers the undercut. | Lielisks risinājums ļoti bieziem, blīviem vai rupjiem matiem; garie mati pilnībā nosedz undercut zonu. | c0c6da3e |  |
| long-hidden-undercut.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| long-hidden-undercut.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| long-hidden-undercut.grow_out | The undercut stays covered while it grows back, but it takes several months to reach the length around it. | Undercut ataugot paliek nosegts, taču paies vairāki mēneši, līdz tas sasniegs pārējo matu garumu. | 41e78a11 |  |
| long-hidden-undercut.client | Long hair that feels much lighter because bulk is removed from underneath. | Gari mati, kas šķiet daudz vieglāki, jo apakšā noņemts liekais matu apjoms. | db891073 |  |
| long-hidden-undercut.stylist | Clipper cut a section at the nape and above the ears, then drop the long hair to cover it. Weight: the nape and lower sides are shortened beneath the long lengths to remove bulk. | Ar mašīnīti nogriez zonu pie kakla un virs ausīm, pēc tam pārlaid pāri garos matus, lai to nosegtu. Smagums: zona pie kakla un sānu apakšdaļa zem garajiem matiem ir saīsināta, lai noņemtu lieko biezumu. | d50c96c8 |  |
| mid-back-soft-layers.name | Mid-back soft layers | Maigas pakāpes matiem līdz muguras vidum | f9d94a29 |  |
| mid-back-soft-layers.texture_fit.curly.note | cut dry and keep layers minimal to avoid a pyramid shape | griez sausos matos un veido minimālas pakāpes, lai izvairītos no piramīdas formas | 93a02219 |  |
| mid-back-soft-layers.texture_fit.coily.note | keep the layers very shallow and allow for 30 percent or more shrinkage | veido pavisam seklas pakāpes un rēķinies ar 30 vai vairāk procentu saraušanos | f8368264 |  |
| mid-back-soft-layers.density_fit.low.note | fine hair looks stringy at this length, so keep a blunt perimeter | smalki mati šādā garumā izskatās šķipsnaini, tāpēc saglabā taisnu apakšējo līniju | 3c5b1c95 |  |
| mid-back-soft-layers.density_fit.high.note | thick hair benefits from interior weight removal | bieziem matiem par labu nāk iekšējā biezuma noņemšana | a5a84994 |  |
| mid-back-soft-layers.growth.note | Check the nape growth direction, because the long back highlights whorls. | Pārbaudi matu augšanas virzienu pie kakla, jo garie mati aizmugurē izceļ virpuļus. | 53fe0b00 |  |
| mid-back-soft-layers.strand_note | Long lengths put stress on the ends. The oldest hair is at the edge, so regular dusting matters. | Liels matu garums rada slodzi galiņiem. Paši galiņi ir visvecākā matu daļa, tāpēc regulāra to aplīdzināšana ir ļoti svarīga. | 6fb6c8a6 |  |
| mid-back-soft-layers.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| mid-back-soft-layers.upkeep.products.1 | light oil | viegla eļļa | 7170b5ea |  |
| mid-back-soft-layers.grow_out | Almost no grow-out because length is the priority; just dust the ends every 3-4 months. | Ataugšanas posms gandrīz nav pamanāms, jo galvenais ir garums; tikai reizi 3-4 mēnešos nedaudz jāapgriež paši galiņi. | 7f486731 |  |
| mid-back-soft-layers.client | Very long hair with a few light layers around the face, mostly to keep the length. | Ļoti gari mati ar dažām vieglām pakāpēm ap seju, galvenokārt saglabājot kopējo garumu. | 42286420 |  |
| mid-back-soft-layers.stylist | Start the first layer at the chin, cut it long and soft, and leave the back untouched apart from a shallow curve at the ends. Weight: maximum length kept, with a few soft layers starting below the chin. | Sāc pirmo pakāpi pie zoda, veido to garu un maigu, un aizmuguri atstāj neskartu, izņemot lēzenu izliekumu galos. Smagums: maksimāli saglabāts garums ar dažām maigām pakāpēm, kas sākas zem zoda. | 9519f7bd |  |
| long-layers-natural.name | Long layers, natural | Garas pakāpes, dabiskas | 45400a17 |  |
| long-layers-natural.sideburns | Blended | Sapludinātas | 80749709 |  |
| long-layers-natural.texture_fit.curly.note | Layers prevent a triangle shape. | Pakāpes novērš trīsstūra formas veidošanos. | d981f622 |  |
| long-layers-natural.texture_fit.coily.note | Needs moisture; twist-outs. | Nepieciešams mitrums; twist-outs. | b52a01c2 |  |
| long-layers-natural.density_fit.low.note | Use fewer, longer layers so the ends keep their weight. | Veido mazāk pakāpju un saglabā tās garākas, lai matu gali saglabātu biezumu. | 41864e90 |  |
| long-layers-natural.growth.note | Length covers recession at stage 3-4. | Garums nosedz atkāpušos matu līniju 3.-4. stadijā. | cce49a0e |  |
| long-layers-natural.density_note | Any; thin hair looks better with fewer layers. | Jebkurš; plāniem matiem labāk izskatās mazāk pakāpju. | 8044b2bc |  |
| long-layers-natural.glasses_note | Hair may tuck behind arms. | Matus var aizlikt aiz briļļu kājiņām. | 02016e12 |  |
| long-layers-natural.upkeep.products.0 | oil | eļļa | ab7902bc |  |
| long-layers-natural.upkeep.products.1 | conditioner | kondicionieris | d8dc0472 |  |
| long-layers-natural.grow_out | Just wait: growth pace is about 1 cm per month. | Atliek tikai pagaidīt: augšanas ātrums ir apmēram 1 cm mēnesī. | 24655e40 |  |
| long-layers-natural.client | Hair past the shoulders with long layers. It needs care, moisture and gentle brushing. | Mati pāri pleciem ar garām pakāpēm. Tiem nepieciešama kopšana, mitrināšana un saudzīga ķemmēšana. | 8938bc05 |  |
| long-layers-natural.stylist | Cut a clean perimeter, use long soft layers to avoid a triangle shape, and trim every 2-3 months to remove splits. | Nogriez tīru perimetru, veido garas, maigas pakāpes, lai izvairītos no trīsstūra formas, un pielīdzini reizi 2-3 mēnešos, lai noņemtu šķeltos galus. | d69196b3 |  |
| man-bun-classic.name | Man bun | Man bun | a4bdaf29 | same |
| man-bun-classic.sideburns | Natural | Dabiskas | d6acb6d5 |  |
| man-bun-classic.texture_fit.coily.note | Needs 15+ cm; coily hair forms a puff or twist-bun rather than a smooth bun. | Nepieciešami 15+ cm; sīki cirtaini mati drīzāk veidos kuplu apjomu vai twist-bun, nevis gludu copi. | 35e63153 |  |
| man-bun-classic.density_fit.low.note | The bun will be smaller; tie it loosely to spare the hairline. | Cope būs mazāka; sien to brīvāk, lai saudzētu matu augšanas līniju. | 0624860e |  |
| man-bun-classic.growth.note | Pulling back exposes the hairline. | Matu saņemšana atpakaļ atsedz matu augšanas līniju. | 50c3fd0d |  |
| man-bun-classic.density_note | Medium to thick for a full bun. | Vidēji līdz biezi mati, lai cope būtu kupla. | 242147ec |  |
| man-bun-classic.glasses_note | Fine; the bun sits above the frame arms. | Piemērots; cope atrodas virs briļļu kājiņām. | 175d9534 |  |
| man-bun-classic.upkeep.products.0 | elastic | matu gumija | 98605138 |  |
| man-bun-classic.upkeep.products.1 | light oil | viegla eļļa | 7170b5ea |  |
| man-bun-classic.grow_out | Keep the length; undercut the sides if the bulk becomes heavy. | Saglabā garumu; ja sānos veidojas pārāk liels biezums, izveido undercut. | 0846adbd |  |
| man-bun-classic.client | Long hair gathered into a bun at the back or top of the head. Practical and tidy once tied. | Gari mati, kas savilkti copē pakausī vai galvvidū. Sasieti izskatās kārtīgi un ir ļoti praktiski. | ace480bb |  |
| man-bun-classic.stylist | Trim the ends square, remove weight at the hairline for comfort, and check that the top layers reach the tie point. | Pielīdzini galus taisni, ērtībai noņem biezumu pie matu augšanas līnijas un pārbaudi, vai virsējās pakāpes sniedzas līdz copes vietai. | ce63a5e6 |  |
| top-knot-undercut.name | Top knot with undercut | Top knot ar undercut | c261d665 |  |
| top-knot-undercut.fade.note | Mid skin fade. | Mid skin fade. | 0833fb90 | same |
| top-knot-undercut.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| top-knot-undercut.texture_fit.coily.note | Needs 15+ cm for a knot; coils tend to form a puff, so twisting first helps. | Mezglam nepieciešami 15+ cm; sīkas cirtas mēdz veidot kuplu formu, tāpēc palīdzēs iepriekšēja savīšana šķipsnās. | d86edd95 |  |
| top-knot-undercut.density_fit.low.note | The knot will be smaller; tie it loosely. | Mezgls būs mazāks; sien to brīvāk. | bdccf94a |  |
| top-knot-undercut.growth.note | Tight pull exposes the hairline. | Cieši saņemti mati atsedz matu augšanas līniju. | 5abf061e |  |
| top-knot-undercut.density_note | Medium; the knot needs enough density to have shape. | Vidējs; mezglam nepieciešams pietiekams biezums, lai turētu formu. | 69668618 |  |
| top-knot-undercut.glasses_note | The knot sits above the frame arms; faded sides keep arms clear. | Mezgls atrodas virs briļļu kājiņām; fade sānos atstāj kājiņas brīvas. | 636d370c |  |
| top-knot-undercut.upkeep.products.0 | elastic | matu gumija | 98605138 |  |
| top-knot-undercut.upkeep.products.1 | pomade | pomāde | d3fe5b65 |  |
| top-knot-undercut.grow_out | Stop clipping the sides; the fade grows into a long tied-back style over 6 months. | Pārtrauc īsināt sānus; fade 6 mēnešu laikā ataugs par garu, atpakaļ saņemtu sakārtojumu. | 71e7eac6 |  |
| top-knot-undercut.client | Long hair on top gathered into a knot, with faded sides. Smart and practical for long hair. | Gari mati galvvidū savilkti mezglā, bet sānos izveidota fade pāreja. Gaumīgs un praktisks risinājums gariem matiem. | d429fbc2 |  |
| top-knot-undercut.stylist | Separate the top at the parietal ridge, fade the sides to #1-#2 and leave 15+ cm on top for the knot. | Atdali augšpusi pie parietālās līnijas, veido sānos fade līdz #1-#2 un augšpusē atstāj 15+ cm mezglam. | 26ea68ed |  |
| curly-long-natural.name | Long curls, natural | Garas cirtas, dabiskas | e99f5e54 |  |
| curly-long-natural.sideburns | Natural | Dabiskas | d6acb6d5 |  |
| curly-long-natural.texture_fit.straight.note | Not suited: use long layers. | Nav piemērots: izvēlies garas pakāpes. | bb9cae85 |  |
| curly-long-natural.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-long-natural.texture_fit.coily.note | Works as a stretched twist-out or defined afro. | Labi izskatīsies kā izstiepts twist-out vai izteiksmīgs afro. | 5065e70e |  |
| curly-long-natural.density_fit.low.note | Add a few long layers so the ends do not look sparse. | Veido dažas garas pakāpes, lai matu gali neizskatītos paplāni. | e092d703 |  |
| curly-long-natural.growth.note | Length covers recession at stage 3-4. | Garums nosedz atkāpušos matu līniju 3.-4. stadijā. | cce49a0e |  |
| curly-long-natural.density_note | Any density; low density curls need a few layers to avoid a thin look. | Jebkurš biezums; retākām lokām noder dažas pakāpes, lai mati neizskatītos plāni. | a6cafb32 |  |
| curly-long-natural.glasses_note | Hair may curl or drop over the arms of glasses; trim a clean channel behind the ear if frames sit on top of the hair. | Mati var lokoties vai krist pāri briļļu kājiņām; aiz ausīm izveido tīru līniju, ja rāmis balstās uz matiem. | b7f64717 |  |
| curly-long-natural.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-long-natural.upkeep.products.1 | oil | eļļa | ab7902bc |  |
| curly-long-natural.grow_out | Grows about 1 cm per month. | Ataug apmēram 1 cm mēnesī. | b62e9c17 |  |
| curly-long-natural.client | Long curly hair worn loose. Needs moisture and a gentle comb through. | Gari cirtaini mati, ko nēsā izlaistus. Tiem nepieciešams mitrums un saudzīga izķemmēšana. | 2d8a3a68 |  |
| curly-long-natural.stylist | Trim ends every 3 months, shape with a few layers and avoid heat; moisture and a wide-tooth comb are key. | Pielīdzini galus reizi 3 mēnešos, piešķir formu ar dažām pakāpēm un izvairies no karstuma; galvenais ir mitrināšana un ķemme ar retiem zariem. | 7a41418e |  |
| long-hush-cut.name | Korean hush cut, long | Korejiešu hush cut gariem matiem | 6a11ac5c |  |
| long-hush-cut.texture_fit.curly.note | only loose 3A curls cut dry, with no razor, will work; for tighter curls see curly-face-frame-length | būs piemērots tikai vieglām 3A cirtām, griežot sausos matos un bez žiletes; ciešākām cirtām skatīt curly-face-frame-length | 9ac0038c |  |
| long-hush-cut.texture_fit.coily.note | see coily-length-preserving-layers | skatīt coily-length-preserving-layers | 90ab4ee6 |  |
| long-hush-cut.density_fit.low.note | use fewer layers and keep the ends fuller | veido mazāk pakāpju un saglabā biezākus matu galus | ad7db6c8 |  |
| long-hush-cut.density_fit.high.note | thinned ends lighten thick hair | izplānināti gali padara biezus matus vieglākus | 92cc47d3 |  |
| long-hush-cut.growth.whorl_note | Keep the crown layers a little longer around a whorl so they do not stand up. | Ap virpuli virsgalvja pakāpes atstāj nedaudz garākas, lai tās nesaceltos stāvus. | ef99abe6 |  |
| long-hush-cut.growth.note | Face pieces start at the chin, so a strong front cowlick changes how they fall. Check it before cutting. | Priekšējās šķipsnas sākas pie zoda, tāpēc izteikts virpulis pie pieres maina to, kā tās krīt. Pirms griešanas to pārbaudi. | ffed2bf7 |  |
| long-hush-cut.strand_note | Fine to medium strands move well with thinned ends. Coarse strands can frizz at the ends, so cut those with scissors. | Smalki līdz vidēji biezi mati ar filētiem galiem labi kustas. Rupji mati galos var pūkoties, tāpēc tos griez ar šķērēm. | a9cc3efc |  |
| long-hush-cut.density_note | Thick hair gets lighter ends. Very fine hair needs fewer layers, or the hem looks thin. | Bieziem matiem galus padara vieglākus. Ļoti smalkiem matiem vajag mazāk pakāpju, citādi apakšējā līnija izskatīsies par plānu. | 2d8bae1f |  |
| long-hush-cut.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| long-hush-cut.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| long-hush-cut.grow_out | The layers soften into plain long layers, with no clear line to grow out. | Pakāpes ataugot kļūst maigākas un pāriet parastā garā pakāpeniskā griezumā, bez krasas ataugšanas līnijas. | 30f321f9 |  |
| long-hush-cut.client | Long layers that start at the chin, with light pieces curving in around the face and thinned, airy ends. The hair stays long but feels light and moves easily. | Garas pakāpes, kas sākas pie zoda, ar vieglām šķipsnām, kas maigi liecas uz iekšu ap seju, un gaisīgiem, plāninātiem galiem. Mati saglabā garumu, taču šķiet viegli un dabiski kustas. | 6402506e |  |
| long-hush-cut.stylist | Cut light layers from the chin down, with scissors or a light razor on straight or wavy hair. Curve the face pieces in at the jaw (about 20-26 cm) and keep the outline narrow through the lengths, not round. Thin the ends so they look see-through. If the shape turns round and bouncy, it has become a butterfly cut. Weight: light, feathered layers with a narrow outline and wispy ends. | Griez vieglus slāņus no zoda uz leju ar šķērēm vai vieglu skuvekli taisniem vai viļņainiem matiem. Seju ierāmējošās šķipsnas ieveido uz iekšu pie žokļa līnijas (aptuveni 20–26 cm) un saglabā šauru siluetu visā garumā, nevis apaļu. Galus izfilē, lai tie izskatītos gaisīgi caurspīdīgi. Ja forma kļūst apaļa un atsperīgi kupla, tas jau ir butterfly cut. Masa: viegli, filēti slāņi ar šauru siluetu un gaisīgiem galiem. | 0e00bbb4 |  |
| long-sleek-face-frame.name | Long sleek cut with face pieces | Gari, gludi mati ar seju ierāmējošām šķipsnām | f1ebdc72 |  |
| long-sleek-face-frame.texture_fit.wavy.note | needs a smooth blow-dry to keep the hem sleek | izfēno taisnus, lai apakšējā līnija saglabātos gluda | ba3d7975 |  |
| long-sleek-face-frame.texture_fit.curly.note | the face pieces spring up; see curly-face-frame-length | seju ierāmējošās šķipsnas sarausies uz augšu; skatīt curly-face-frame-length | 8567af6b |  |
| long-sleek-face-frame.texture_fit.coily.note | see curly-face-frame-length | skatīt curly-face-frame-length | 1ce8bfd7 |  |
| long-sleek-face-frame.density_fit.high.note | take weight out from inside so the blunt hem does not sit heavy | noņem biezumu no iekšpuses, lai taisnā apakšējā līnija neizskatītos smagnēja | 66f4b728 |  |
| long-sleek-face-frame.growth.note | Check the nape growth direction, because a blunt line shows it. | Pārbaudi matu augšanas virzienu kakla daļā, jo taisna griezuma līnija to skaidri parāda. | 9f876b81 |  |
| long-sleek-face-frame.strand_note | Fine to medium strands look fuller with a blunt edge. Thick hair feels heavy without thinning inside. | Smalki līdz vidēji biezi mati ar taisnu līniju izskatās biezāki. Biezi mati bez iekšējas filēšanas šķitīs smagnēji. | 62923795 |  |
| long-sleek-face-frame.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| long-sleek-face-frame.upkeep.products.1 | light oil | viegla eļļa | 7170b5ea |  |
| long-sleek-face-frame.grow_out | Needs only a dusting trim. The face pieces grow into plain long hair. | Nepieciešama tikai viegla galu pielīdzināšana. Priekšējās šķipsnas ataugot vienkārši saplūst ar garajiem matiem. | fd977626 |  |
| long-sleek-face-frame.client | Long hair with one clean, blunt edge and two to four shorter pieces around the face. It looks sleek and takes little work. | Gari mati ar vienu precīzu, taisnu apakšējo līniju un divām līdz četrām īsākām šķipsnām ap seju. Izskatās gludi un prasa minimālu piepūli. | a58ec993 |  |
| long-sleek-face-frame.stylist | Cut one blunt hem with shears, as a razor spoils the line, and add no inside layers. Cut two to four face pieces from the chin to the collarbone (about 22-32 cm). From behind it looks the same as a long one-length cut, so the face pieces are the only difference. Weight: one blunt weight line with a few face-framing pieces. | Griez vienu taisnu apakšējo līniju ar šķērēm, jo skuveklis sabojā līniju, un neveido iekšējos slāņus. Nogriez divas līdz četras seju ierāmējošās šķipsnas no zoda līdz atslēgas kaulam (aptuveni 22–32 cm). No aizmugures tas izskatās kā klasisks viena garuma griezums, tāpēc priekšējās šķipsnas ir vienīgā atšķirība. Masa: viena taisna masas līnija ar dažām seju ierāmējošām šķipsnām. | 0226c593 |  |
| long-step-cut.name | Step cut | Step cut | 524efcc6 | same |
| long-step-cut.texture_fit.wavy.note | waves blur the steps | viļņaini mati izpludina pakāpienus | f3d8aa5f |  |
| long-step-cut.texture_fit.curly.note | the steps vanish into the curl | cirtās pakāpieni pazūd | 0a4cd1ba |  |
| long-step-cut.texture_fit.coily.note | the steps vanish into the coil | sīkās cirtās pakāpieni pazūd | 0982d2db |  |
| long-step-cut.density_fit.low.note | each step needs enough hair; fine hair looks thin on the upper steps | katram pakāpienam nepieciešams pietiekams matu biezums; smalki mati augšējos pakāpienos izskatīsies paplāni | 15ff32c4 |  |
| long-step-cut.density_fit.high.note | thick hair shows the steps best | biezos matos pakāpieni izskatās vislabāk | 6c6c8170 |  |
| long-step-cut.growth.note | Steps show a cowlick at the nape, so check the nape growth direction first. | Pakāpienu griezums izceļ virpuli pie kakla, tāpēc vispirms pārbaudi matu augšanas virzienu kakla zonā. | 4d5399a9 |  |
| long-step-cut.strand_note | Thick strands show the steps best. Fine strands look thin on the upper steps. | Biezos matos pakāpieni izceļas vislabāk. Smalki mati augšējos pakāpienos izskatās paplāni. | bbbbf43b |  |
| long-step-cut.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| long-step-cut.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| long-step-cut.grow_out | The steps lose their edge in about 2 to 3 months and blur into long layers. | Pakāpieni zaudē savu izteikto formu aptuveni 2 līdz 3 mēnešu laikā un saplūst garā pakāpeniskā griezumā. | 6a432cc8 |  |
| long-step-cut.client | Long hair cut in three or four clear steps down the back. The steps give shape and movement, and they show most on thick hair. | Gari mati, kas mugurpusē nogriezti trīs vai četros skaidros pakāpienos. Tie piešķir formu un kustību, un vislabāk izceļas biezos matos. | df5a85e2 |  |
| long-step-cut.stylist | Cut three or four horizontal tiers down the back, about 8-12 cm apart, and leave them visible instead of blending them out. Keep the longest tier at the shoulder blades or lower. Face pieces can flick out from the cheek. Weight: three or four clear horizontal tiers down the back. | Izveido trīs vai četrus horizontālus līmeņus mugurpusē ar aptuveni 8–12 cm atstarpi un atstāj tos skaidri redzamus, nevis sapludini. Garāko līmeni saglabā lāpstiņu augstumā vai zemāk. Priekšējās šķipsnas no vaigu līnijas var ieveidot uz āru. Masa: trīs vai četri skaidri horizontāli līmeņi aizmugurē. | 1c5320fe |  |
| long-curls-light-layers.name | Long curls, barely layered | Garas cirtas ar tikko manāmām pakāpēm | 13f40fb1 |  |
| long-curls-light-layers.texture_fit.straight.note | there is no curl to shape the cut around | nav cirtu, pēc kurām veidot griezumu | b385cb74 |  |
| long-curls-light-layers.texture_fit.wavy.note | waves do not hold this shape | viļņaini mati netur šo formu | 9d6bff7c |  |
| long-curls-light-layers.texture_fit.curly.note | tight 3C curls shrink most and land higher | stingras 3C cirtas saraujas visvairāk un paceļas augstāk | 862b752c |  |
| long-curls-light-layers.texture_fit.coily.note | 4A needs more length, and the hair lands higher when dry | 4A tipam vajag lielāku garumu, jo sausi mati pacelsies augstāk | 100f7cc2 |  |
| long-curls-light-layers.density_fit.low.note | fine curls lose body with this much length and so few layers | smalkas cirtas šādā garumā un ar tik maz pakāpēm zaudē apjomu | af9d1a42 |  |
| long-curls-light-layers.density_fit.high.note | take weight out from inside | noņem masu no iekšpuses | 53b025e0 |  |
| long-curls-light-layers.growth.note | Curls spiral around whorls, so check the crown and nape before cutting. | Cirtas vijas ap virpuļiem, tāpēc pirms griešanas pārbaudi galvvidu un kakla daļu. | 0da03523 |  |
| long-curls-light-layers.strand_note | Medium to thick curls give the full, even shape. Fine curls fall flat at the ends. | Vidēja biezuma un biezas cirtas veido pilnīgu, vienmērīgu formu. Smalkas cirtas galos saplok. | 435d293f |  |
| long-curls-light-layers.density_note | Thick hair: take weight out from inside so the shape does not turn into a triangle. | Bieziem matiem: noņem masu no iekšpuses, lai forma nekļūtu trīsstūrveida. | 060b7cf3 |  |
| long-curls-light-layers.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| long-curls-light-layers.upkeep.products.1 | curl-defining gel | želeja cirtu izcelšanai | c3f5576c |  |
| long-curls-light-layers.grow_out | Grows out with no visible step. Trim the ends about every 3 months. | Ataug bez redzamām pakāpēm. Pielīdzini galus aptuveni reizi 3 mēnešos. | 8068b52d |  |
| long-curls-light-layers.client | Long curls with very few layers and a full, even shape down to the ends. Dry, they land between the shoulders and the armpits. | Garas cirtas ar pavisam vieglām pakāpēm un pilnīgu, vienmērīgu formu līdz pat galiem. Sausi mati sniedzas no pleciem līdz padusēm. | 90506a89 |  |
| long-curls-light-layers.stylist | Cut dry, curl by curl, with very few layers so the mass stays full and even to the hem. Plan for 30-55% shrinkage: at a typical 35% the back lands at about 31-44 cm, from the shoulder to the armpit. On thick hair, take weight out from inside so the shape does not turn into a triangle. Weight: a full, even curl mass to the hem with barely any layers. | Griez sausus matus, cirta pēc cirtas, veidojot pavisam minimālu pakāpi, lai apjoms saglabātos pilnīgs un vienmērīgs līdz pat apakšējai līnijai. Rēķinies ar 30–55% saraušanos: pie tipiskiem 35% aizmugurē garums būs aptuveni 31–44 cm, no pleca līdz padusei. Bieziem matiem noņem masu no iekšpuses, lai forma nekļūtu trīsstūrveida. Masa: pilnīga, vienmērīga cirtu masa līdz pašai apakšējai līnijai ar gandrīz nemanāmu pakāpi. | 3d85c2bc |  |
| long-coily-blunt-shape.name | Blunt-shaped coils, long when stretched | Taisna griezuma sīkas cirtas, garas izstieptā veidā | 56a7e1e3 |  |
| long-coily-blunt-shape.texture_fit.straight.note | not recommended | nav ieteicams | 649cfa2f |  |
| long-coily-blunt-shape.texture_fit.wavy.note | not recommended | nav ieteicams | 649cfa2f |  |
| long-coily-blunt-shape.texture_fit.curly.note | looser curls do not hold an even blunt shape; see the Curly U-shape long layers | vaļīgākas cirtas netur vienmērīgu, taisnu formu; apskati Curly U-shape long layers | 63235d06 |  |
| long-coily-blunt-shape.density_fit.low.note | fine coils look sparse at the ends, so keep the density | smalkas cirtas galos izskatās paplānas, tāpēc saglabā biezumu | 26cb8c94 |  |
| long-coily-blunt-shape.growth.note | Check the nape and crown for whorls that shorten the cut. | Pārbaudi, vai kakla daļā un galvvidū nav virpuļu, kuru dēļ griezums var izskatīties īsāks. | 61d9cb92 |  |
| long-coily-blunt-shape.strand_note | Dense coils hold the even hem. Very fine strands look sparse at the ends. | Biezas cirtas labi notur taisno līniju. Ļoti smalki mati galos izskatās paplāni. | b0822265 |  |
| long-coily-blunt-shape.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| long-coily-blunt-shape.upkeep.products.1 | styling cream | ieveidošanas krēms | 01654a1c |  |
| long-coily-blunt-shape.grow_out | Grows out evenly because nothing is cut away. A dusting trim keeps the ends healthy. | Ataug vienmērīgi, jo nekas nav izgriezts. Viegla galu pielīdzināšana palīdz uzturēt tos veselīgus. | d986fae7 |  |
| long-coily-blunt-shape.client | Natural coils shaped to one even edge. Pulled straight the hair is very long, but dry it lands between the jaw and the shoulders. | Dabiskas sīkas cirtas, kas apgrieztas vienā taisnā līnijā. Izstiepti mati ir ļoti gari, bet sausi tie sniedzas no žokļa līnijas līdz pleciem. | 3e14b801 |  |
| long-coily-blunt-shape.stylist | Check the hem on stretched hair, in sections, and keep it blunt with the ends dusted. Use no layers. Plan for 50-70% shrinkage: the back lands at about 14-35 cm dry, from the jaw to the shoulder. Show it as a twist-out with the hem resting on the shoulders, never hanging to the shoulder blades. Weight: even weight to a blunt hem in an A-frame mass. | Pārbaudi apakšējo līniju, pa šķipsnām izstiepjot matus, un saglabā to taisnu, tikai viegli aplīdzinot pašus galus. Neveido pakāpi. Rēķinies ar 50–70% saraušanos: sausiem matiem mugurpusē garums būs aptuveni 14–35 cm, no žokļa līnijas līdz plecam. Parādi to kā twist-out sakārtojumu, kur matu gali gulstas uz pleciem, nevis sniedzas līdz lāpstiņām. Masa: vienmērīga masa līdz taisnai apakšējai līnijai A veida siluetā. | 8bec67db |  |
| long-coily-blunt-shape.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| hug-cut.name | Hug cut | Hug cut | 4af2f0ec | same |
| hug-cut.texture_fit.wavy.note | waves need a blow-dry or flat iron to bring the ends in | viļņainiem matiem vajadzēs fēnu vai taisnotāju, lai galus ieveidotu uz iekšu | 00461f10 |  |
| hug-cut.texture_fit.curly.note | the inward curve cannot be held by the cut alone | tikai ar griezumu vien nevar noturēt izliekumu uz iekšu | 7d0f80af |  |
| hug-cut.texture_fit.coily.note | the inward curve cannot be held by the cut alone | tikai ar griezumu vien nevar noturēt izliekumu uz iekšu | 7d0f80af |  |
| hug-cut.density_fit.low.note | fine hair loses weight in the layers, so keep them few | smalki mati pakāpēs zaudē biezumu, tāpēc veido tās minimāli | ed224a01 |  |
| hug-cut.density_fit.high.note | the layers lighten thick hair | pakāpe padara biezus matus vieglākus | 8ce450bb |  |
| hug-cut.growth.note | Check the nape and the front hairline so the front pieces fall evenly. | Pārbaudi matu augšanu pie kakla un priekšējo matu līniju, lai priekšējās šķipsnas kristu vienmērīgi. | 1a34a053 |  |
| hug-cut.strand_note | Smooth, straight strands hold the curve best. Very coarse strands spring out. | Gludi, taisni mati vislabāk saglabā izliekumu. Ļoti rupji mati mēdz atliekties uz āru. | 7aae6a79 |  |
| hug-cut.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| hug-cut.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| hug-cut.grow_out | The curve relaxes after about 8 to 10 weeks and the cut becomes long layers. | Izliekums zūd aptuveni pēc 8 līdz 10 nedēļām, un griezums pārvēršas parastā garā pakāpeniskā griezumā. | 8ef25436 |  |
| hug-cut.client | Long layers that start below the chin and curve in to hug the neck and shoulders. The front is longer than the back. | Garas pakāpes, kas sākas zem zoda līnijas un liecas uz iekšu, maigi ieskaujot kaklu un plecus. Priekšpuse ir garāka par aizmuguri. | e2ef6de7 |  |
| hug-cut.stylist | Cut a long A-line with the front hem 8-10 cm longer than the back. Start C-shaped layers below the chin (about 24-30 cm) and curve them in, so the ends can wrap the neck. Half the curve comes from styling, so show it with a blow-dry or flat iron, or it reads as a long A-line cut. Weight: a long A-line hem with C-shaped layers that curve inward. | Griez pagarinātu A siluetu, kur priekšējā līnija ir par 8–10 cm garāka nekā aizmugure. Sāc C veida slāņus zem zoda (aptuveni 24–30 cm) un izliec tos uz iekšu, lai gali apņem kaklu. Pusi no izliekuma efekta dod ieveidošana, tāpēc parādi to, ieveidojot ar fēnu vai taisnotāju, citādi tas izskatīsies vienkārši kā garš A līnijas griezums. Masa: pagarināta A silueta apakšējā līnija ar uz iekšu izliektiem C veida slāņiem. | a5718640 |  |
| waist-length-one-length.name | Waist-length one-length | Viena garuma mati līdz viduklim | 91df6ef8 |  |
| waist-length-one-length.texture_fit.wavy.note | waves shrink up, so allow extra length | viļņaini mati sarausies uz augšu, tāpēc paredzi papildu garumu | 65fb9c6f |  |
| waist-length-one-length.texture_fit.curly.note | curls shrink too much to reach the waist | cirtas pārāk stipri sarausies, lai sniegtos līdz viduklim | 496fee7e |  |
| waist-length-one-length.texture_fit.coily.note | coils shrink too much to reach the waist | sīkās cirtas pārāk stipri sarausies, lai sniegtos līdz viduklim | a6556410 |  |
| waist-length-one-length.density_fit.low.note | the ends look thin at this length | šādā garumā matu gali izskatās plāni | b0998b2f |  |
| waist-length-one-length.density_fit.high.note | very thick hair is heavy at this length, so take weight out from inside | ļoti biezi mati šādā garumā ir smagi, tāpēc noņem biezumu no iekšpuses | cc97477b |  |
| waist-length-one-length.growth.note | Check the nape growth direction, because a long blunt line shows it. Reaching this length takes a long time. | Pārbaudi matu augšanas virzienu kakla daļā, jo gara, taisna līnija to skaidri parāda. Šāda garuma izaudzēšana prasa ilgu laiku. | 045aff10 |  |
| waist-length-one-length.strand_note | Strong, thick strands hold the hem best. Fine strands go thin at the ends. | Spēcīgi, biezi mati vislabāk notur taisno līniju. Smalki mati galos kļūst plāni. | c54e21cd |  |
| waist-length-one-length.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| waist-length-one-length.upkeep.products.1 | light oil | viegla eļļa | 7170b5ea |  |
| waist-length-one-length.grow_out | Needs only dusting trims, every 12 to 16 weeks, to keep the ends healthy. | Nepieciešama tikai viegla galu pielīdzināšana ik pēc 12 līdz 16 nedēļām, lai uzturētu matu galus veselīgus. | f3e477ee |  |
| waist-length-one-length.client | Hair cut to one clean edge at the waist. It is very long, so it needs a long grow-out and careful care. | Mati apgriezti vienā taisnā līnijā līdz viduklim. Tie ir ļoti gari, tāpēc ataudzēšanai vajadzīgs ilgs laiks un rūpīga kopšana. | 2d29bba9 |  |
| waist-length-one-length.stylist | Cut one blunt hem at the waist, with no layers. Hip length is the same cut with more hair. Check the hem with the client standing and the hair brushed straight. Weight: one blunt weight line at the waist. | Griez vienu taisnu līniju vidukļa augstumā, bez pakāpes. Griezums līdz gurniem ir tas pats, tikai ar garākiem matiem. Pārbaudi apakšējo līniju, kad klients stāv kājās un mati ir taisni izķemmēti. Masa: viena taisna masas līnija vidukļa līmenī. | 934121ec |  |
| long-shaved-side.name | Long hair with a shaved side | Gari mati ar skūtu sānu | e2555af4 |  |
| long-shaved-side.fade.note | Clip one side to 3-15 mm in a band 4-8 cm high above the ear. Leave a clear step to the longer hair. | Nogriez vienu sānu ar mašīnīti 3–15 mm garumā 4–8 cm platā joslā virs auss. Atstāj izteiktu pāreju pret garākajiem matiem. | 4e5fa0a0 |  |
| long-shaved-side.texture_fit.curly.note | the long side shrinks as it dries; see Long curls with a tapered side | garais sāns žūstot sarausies; apskati Long curls with a tapered side | 03f5f903 |  |
| long-shaved-side.texture_fit.coily.note | the long side shrinks as it dries; see Long curls with a tapered side | garais sāns žūstot sarausies; apskati Long curls with a tapered side | 03f5f903 |  |
| long-shaved-side.density_fit.low.note | the long side has less hair to cover the line | garajā pusē ir mazāk matu, ar ko nosegt dalījuma līniju | 8ea2ba5a |  |
| long-shaved-side.density_fit.high.note | removes bulk on one side | noņem biezumu vienā pusē | 2be08332 |  |
| long-shaved-side.growth.whorl_note | A whorl above the ear can pull the clipper line out of place, so mark the line first. | Virpulis virs auss var novirzīt mašīnītes griezuma līniju, tāpēc vispirms to iezīmē. | 301be0a3 |  |
| long-shaved-side.growth.note | The shaved side shows when the hair is tied back, so check any work rule on hair first. | Noskūtā puse būs redzama, kad mati ir saņemti astē, tāpēc vispirms noskaidro darbavietas noteikumus par matu sakārtojumu. | 42954f52 |  |
| long-shaved-side.strand_note | Every strand type works. Coarse strands stand away from the clipped line, so keep the step clean. | Piemērots jebkura biezuma matiem. Rupji mati pie nogrieztās līnijas mēdz slieties uz augšu, tāpēc veido precīzu un tīru pāreju. | dfb24daf |  |
| long-shaved-side.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| long-shaved-side.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| long-shaved-side.grow_out | The clipped side takes several months to grow level with the rest. | Īsi nogrieztajai pusei nepieciešami vairāki mēneši, lai ataugtu vienā garumā ar pārējiem matiem. | 21ff3e8c |  |
| long-shaved-side.client | Long hair with one side clipped short above the ear, in a clear band with a clear step to the longer hair. The rest keeps its full length. | Gari mati ar vienu īsi nogrieztu sānu virs auss – izteiktā joslā ar skaidru pāreju pret garajiem matiem. Pārējie mati saglabā pilnu garumu. | 6de1283b |  |
| long-shaved-side.stylist | Clip one side from just above the ear in a band 4-8 cm high, to about 3-15 mm, with a clear step to the long hair. Keep the length elsewhere: top 30-55 cm, long side 40-50 cm, back 42-58 cm. The side view must show the shaved side. Mark the line before clipping. Weight: full length kept, with a visible clipper band on one side. | Noskuj ar mašīnīti vienu pusi tieši virs auss 4–8 cm platā joslā līdz aptuveni 3–15 mm garumam ar skaidru pāreju uz garajiem matiem. Pārējās zonās saglabā garumu: augšpusē 30–55 cm, garajā pusē 40–50 cm, aizmugurē 42–58 cm. Sānskatā jābūt redzamai noskūtajai pusei. Pirms skūšanas iezīmē līniju. Masa: saglabāts pilns garums ar labi redzamu, ar mašīnīti noskūtu joslu vienā pusē. | 26f5cddf |  |
| long-curls-tapered-side.name | Long curls with a tapered side | Garas cirtas ar taper sānu | 9cf5d17b |  |
| long-curls-tapered-side.fade.note | Taper one side in a band 5-8 cm high. It goes from about 5 mm at the ear to about 20 mm at the top. Blend it into the curls above. | Izveido taper pāreju vienā pusē 5–8 cm platā joslā: no aptuveni 5 mm pie auss līdz 20 mm augšpusē. Sapludini to ar cirtām virspusē. | 69162cdb |  |
| long-curls-tapered-side.texture_fit.straight.note | there is no curl to shape the cut around | nav cirtu, pēc kurām veidot griezumu | b385cb74 |  |
| long-curls-tapered-side.texture_fit.wavy.note | waves do not hold this shape | viļņaini mati netur šo formu | 9d6bff7c |  |
| long-curls-tapered-side.texture_fit.curly.note | 3C curls work best; looser curls show the taper less clearly | vislabāk izskatās 3C tipa cirtās; vaļīgākās cirtās taper pāreja ir mazāk pamanāma | 8960f2a4 |  |
| long-curls-tapered-side.density_fit.low.note | the long side has less hair to cover the taper | garajā pusē ir mazāk matu, ar ko nosegt taper pāreju | 12f1625c |  |
| long-curls-tapered-side.density_fit.high.note | removes bulk on one side | noņem biezumu vienā pusē | 2be08332 |  |
| long-curls-tapered-side.growth.whorl_note | A whorl above the ear can pull the taper out of place, so mark the line first. | Virpulis virs auss var novirzīt taper pāreju, tāpēc vispirms iezīmē līniju. | 63d9c4d3 |  |
| long-curls-tapered-side.growth.note | The tapered side shows when the hair is tied back, so check any work rule on hair first. | Ar pāreju nogrieztā puse būs redzama, kad mati ir saņemti astē, tāpēc vispirms noskaidro darbavietas noteikumus par matu sakārtojumu. | ef6a76c7 |  |
| long-curls-tapered-side.strand_note | Medium to thick curls cover the taper best. Fine curls leave it showing. | Vidēja biezuma un biezas cirtas vislabāk nosedz taper pāreju. Caur smalkām cirtām tā būs redzama. | 544a8cae |  |
| long-curls-tapered-side.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| long-curls-tapered-side.upkeep.products.1 | curl-defining gel | želeja cirtu izcelšanai | c3f5576c |  |
| long-curls-tapered-side.grow_out | The tapered side takes several months to grow level with the curls. | Īsākajai pusei būs vajadzīgi vairāki mēneši, lai ataugtu vienā garumā ar lokām. | 4c494b5f |  |
| long-curls-tapered-side.client | Long curls with one side tapered short above the ear. Dry, the long curls land between the shoulders and the armpits. | Garas cirtas ar īsi veidotu taper pāreju vienā pusē virs auss. Sausas cirtas sniedzas no pleciem līdz padusēm. | f7230593 |  |
| long-curls-tapered-side.stylist | Taper one side from just above the ear in a band 5-8 cm high, from about 5 mm at the ear to about 20 mm at the top, and blend it into the curls above. Cut the long side dry, curl by curl. Plan for 30-55% shrinkage (coils more): at a typical 35% the back lands at about 31-43 cm. The side view must show the tapered side. Weight: full long curls with a visible tapered side. | Veido taper pāreju vienā pusē tieši virs auss 5–8 cm platā joslā no aptuveni 5 mm pie auss līdz aptuveni 20 mm augšpusē, sapludinot to ar lokām virspusē. Garo pusi griez sausos matos, cirtu pa cirtai. Rēķinies ar 30–55% saraušanos (sīkām cirtām vēl vairāk): pie tipiskiem 35% aizmugurē garums būs aptuveni 31–43 cm. Sānskatā jābūt skaidri redzamai īsākajai pusei ar pāreju. Masa: pilna garuma lokas ar labi pamanāmu taper pāreju vienā pusē. | 9b041666 |  |
| mohawk-classic.name | Mohawk | Mohawk | 5fd2321d | same |
| mohawk-classic.fade.note | Skin or #0.5 at the sides; strip about 4 cm wide down the centre. | Sānos skin fade vai #0.5; pa vidu aptuveni 4 cm plata matu josla. | db551e13 |  |
| mohawk-classic.sideburns | Removed | Noskūtas | 4118fb4f |  |
| mohawk-classic.texture_fit.wavy.note | Keep length 5+ cm. | Saglabā garumu 5+ cm. | a50d06ae |  |
| mohawk-classic.texture_fit.curly.note | Beautiful and bold with curls. | Izskatās lieliski un drosmīgi ar lokām. | 9a39f46b |  |
| mohawk-classic.texture_fit.coily.note | Good with shape-up. | Labi izskatās kopā ar shape-up. | 6dcee32f |  |
| mohawk-classic.density_fit.low.note | Keep the strip shorter and a little wider so it looks filled. | Veido joslu īsāku un nedaudz platāku, lai tā izskatītos biezāka. | d407e673 |  |
| mohawk-classic.growth.note | The strip draws attention to the hairline; best avoided when the temples sit higher. | Matu josla piesaista uzmanību matu augšanas līnijai; labāk izvairīties, ja deniņos mati atkāpušies augstāk. | c8ede418 |  |
| mohawk-classic.density_note | Needs medium density in the strip. | Joslā nepieciešams vidējs matu biezums. | 8ced7076 |  |
| mohawk-classic.glasses_note | Bare sides leave the arms and frame hinges fully on view; choose narrow temples. | Noskūtie sāni pilnībā atsedz briļļu kājiņas un eņģes; izvēlies brilles ar šaurām kājiņām. | 9c124721 |  |
| mohawk-classic.upkeep.products.0 | gel | želeja | cdc00f6c |  |
| mohawk-classic.upkeep.products.1 | pomade | pomāde | d3fe5b65 |  |
| mohawk-classic.grow_out | Grow out is awkward; go via a faux hawk. | Ataudzēt ir sarežģīti; pārejas posmā labāk veidot faux hawk. | 09ff6553 |  |
| mohawk-classic.client | Hair left only in a strip down the middle with bare sides. Bold and high-maintenance. | Mati atstāti tikai joslā pa vidu, bet sāni ir pilnībā noskūti. Drosmīgs griezums, kas prasa regulāru kopšanu. | a3d8a200 |  |
| mohawk-classic.stylist | Mark the strip width (3-5 cm) from forehead to nape, clip the sides to skin or #0.5 with a clean outline, and shape the strip with scissors or a guard graduation. | Iezīmē 3–5 cm platu joslu no pieres līdz kaklam, noskuj sānus līdz ādai vai ar #0.5 uzgali, izveidojot tīru kontūru, un noformē joslu ar šķērēm vai pakāpenisku mašīnītes uzgaļu pāreju. | 19958ddb |  |
| faux-hawk-fade.name | Faux hawk with fade | Faux hawk ar fade | 6d7b4d51 |  |
| faux-hawk-fade.fade.note | Mid fade; the top is pushed to the middle to form a ridge. | Mid fade; virspuses matus ieveido uz centru, veidojot kori. | c004599f |  |
| faux-hawk-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| faux-hawk-fade.texture_fit.curly.note | Great with curls. | Lieliski izskatās ar lokām. | 5cea51bc |  |
| faux-hawk-fade.texture_fit.coily.note | Good with twists. | Labi izskatās ar tvistiem. | bfb0d05f |  |
| faux-hawk-fade.density_fit.low.note | Use a strong matte clay to hold the ridge. | Kores noturēšanai izmanto matētu mālu ar spēcīgu fiksāciju. | 3614726d |  |
| faux-hawk-fade.growth.whorl_note | Ridge draws eyes upward. | Kores forma vērš skatienu uz augšu. | 043569b1 |  |
| faux-hawk-fade.growth.note | Hair pushed toward the centre pulls the front hairline in, so it can look fuller at stage 3-4 (blend high near the temple). | Mati, kas ieveidoti virzienā uz centru, vizuāli sašaurina priekšējo matu līniju, tāpēc 3.–4. stadijā tā var izskatīties biezāka (veido augstu pāreju pie deniņiem). | 9d206f52 |  |
| faux-hawk-fade.density_note | Medium to thick density holds the central ridge; fine hair needs a strong clay or paste. | Vidēji biezi līdz biezi mati labi notur centrālo kori; smalkiem matiem vajadzēs stipras fiksācijas mālu vai pastu. | 24c45553 |  |
| faux-hawk-fade.glasses_note | The fade starts above the arm; trim the hair tightly behind the ear for comfort. | Fade pāreja sākas virs briļļu kājiņas; aiz auss matus nogriez pavisam īsi, lai brilles būtu ērti nēsāt. | 77bc6818 |  |
| faux-hawk-fade.upkeep.products.0 | clay | matu māls | 06363555 |  |
| faux-hawk-fade.upkeep.products.1 | gel | želeja | cdc00f6c |  |
| faux-hawk-fade.grow_out | Stops being a faux hawk in about 4 weeks as the fade grows; the top becomes a textured crop. | Aptuveni 4 nedēļu laikā, ataugot fade pārejai, griezums zaudē faux hawk formu; augšdaļa pārvēršas par teksturētu crop griezumu. | 7c42bb23 |  |
| faux-hawk-fade.client | Short sides with a central ridge of hair on top, styled up. More casual than a full mohawk. | Īsi sāni ar uz augšu ieveidotu matu kori virspuses vidū. Brīvāks un ikdienišķāks par klasisko mohawk. | 20ea9397 |  |
| faux-hawk-fade.stylist | Fade sides to #1, blend into the temple; scissor top to a central ridge. Finish with texturiser. | Sānos veido fade ar #1 uzgali, sapludini deniņos; augšpusi griez ar šķērēm virzienā uz centrālo kori. Nobeigumā izmanto teksturētāju. | 13a90fc8 |  |
| curly-mohawk-fade.name | Curly mohawk fade | Cirtains mohawk ar fade | 005e0512 |  |
| curly-mohawk-fade.fade.note | Skin fade with curls left in the central strip. | Skin fade ar cirtām, kas atstātas vidus joslā. | 0c9668ec |  |
| curly-mohawk-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| curly-mohawk-fade.texture_fit.straight.note | Not suited: use a faux hawk. | Nav piemērots: izvēlies faux hawk. | c033a297 |  |
| curly-mohawk-fade.texture_fit.wavy.note | Waves of 8 cm lift with a pick. | 8 cm garus viļņainus matus var pacelt ar pick ķemmi. | eee8f4ba |  |
| curly-mohawk-fade.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-mohawk-fade.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-mohawk-fade.density_fit.low.note | Keep the strip wider and the curls shorter. | Atstāj matu joslu platāku un cirtas īsākas. | be3ff7e6 |  |
| curly-mohawk-fade.growth.whorl_note | Strip draws eyes upward. | Josla vērš skatienu uz augšu. | e10068b6 |  |
| curly-mohawk-fade.growth.note | Hair in the centre draws attention up; ok at stage 3-4. | Mati centrā vērš skatienu uz augšu; piemērots arī 3.–4. stadijā. | c13b8711 |  |
| curly-mohawk-fade.density_note | Medium to thick; the strip needs density. | Vidēji biezi līdz biezi mati; joslai nepieciešams biezums. | a0b6f864 |  |
| curly-mohawk-fade.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| curly-mohawk-fade.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-mohawk-fade.upkeep.products.1 | gel | želeja | cdc00f6c |  |
| curly-mohawk-fade.grow_out | Allow the sides to grow, then reshape as a curly crop in about 8 weeks. | Ļauj sāniem ataugt un aptuveni pēc 8 nedēļām pārveido to par cirtainu crop griezumu. | b6b519e7 |  |
| curly-mohawk-fade.client | Faded sides with curls rising down the middle. Loud, tall and distinctive. | Sāni ar fade pāreju un paceltām cirtām pa vidu. Pamanāms, augsts un izteiksmīgs. | 381f6ad3 |  |
| curly-mohawk-fade.stylist | Fade the sides to skin and shape the strip with a pick and scissors; keep the front at 5-6 cm. | Sānos veido fade līdz ādai un noformē joslu ar afro ķemmi (pick) un šķērēm; priekšpusē saglabā 5–6 cm garumu. | b11c5718 |  |
| classic-pixie.name | Classic pixie | Klasiskais pixie | ff1e11d5 |  |
| classic-pixie.texture_fit.curly.note | leave the top 1 cm longer on loose curls (3A); use Curly pixie for tighter curls | vaļīgākām cirtām (3A) atstāj virspusi par 1 cm garāku; ciešākām cirtām izvēlies Curly pixie | 995733aa |  |
| classic-pixie.texture_fit.coily.note | use tapered-twa or curly-pixie instead | labāk izvēlies tapered-twa vai curly-pixie | 24b66bff |  |
| classic-pixie.density_fit.high.note | remove bulk at the sides only | noņem biezumu tikai sānos | 3e967d50 |  |
| classic-pixie.growth.note | Check crown whorl and front hairline before clipping the top short; a strong cowlick needs 1 cm more length there. | Pirms nogriez augšdaļu īsu, pārbaudi virpuli galvvidū un priekšējo matu līniju; izteikta virpuļa vietā vajadzēs par 1 cm lielāku garumu. | 77aa52c2 |  |
| classic-pixie.strand_note | Fine strands gain lift from short layers; coarse strands stand up and need some weight left on top. | Smalkiem matiem īsas pakāpes piešķir pacēlumu; rupji mati ceļas stāvus, tāpēc virspusē jāsaglabā smagums. | b03a91a3 |  |
| classic-pixie.upkeep.products.0 | texturising paste | teksturējoša pasta | 5811656a |  |
| classic-pixie.upkeep.products.1 | light wax | viegls vasks | 94347f09 |  |
| classic-pixie.grow_out | Reaches a shaggy pixie at about 8 weeks and a bixie at about 5 months. | Aptuveni 8 nedēļu laikā ataug par shaggy pixie, bet apmēram pēc 5 mēnešiem kļūst par bixie. | 79675e16 |  |
| classic-pixie.client | A short, easy cut with soft layers on top and a side-swept fringe. Wash, add a little paste and go. | Īss, viegli kopjams griezums ar maigām pakāpēm virspusē un uz sānu veidotiem priekšmatiem. Izmazgā, ieklāj nedaudz pastas un dodies gaitās. | 1d67f4bb |  |
| classic-pixie.stylist | Taper the sides and nape close, keep the top longer and point-cut it so the layers lie in a soft feathered direction. Leave the fringe long enough to sweep across. Weight: soft weight at the crown; sides and nape tapered close. | Sānus un kakla daļu veido īsus un piegulošus ar pāreju, augšpusi atstāj garāku un griez ar point-cut tehniku, lai kārtas gultos viegli un gaisīgi. Priekšmatus atstāj pietiekami garus, lai tos varētu pārlaist uz sānu. Masa: viegls apjoms galvvidū; sāni un kakla daļa īsi un pieguloši ar pāreju. | cd37ac54 |  |
| long-top-side-swept-pixie.name | Long-top side-swept pixie | Pixie ar garu virspusi un sānu priekšmatiem | cc137c77 |  |
| long-top-side-swept-pixie.texture_fit.curly.note | keep the top 2 cm longer to allow for curl spring | atstāj virspusi par 2 cm garāku, lai ierēķinātu cirtu saraušanos | f04714a9 |  |
| long-top-side-swept-pixie.texture_fit.coily.note | choose tapered-curly-crop-long-top instead | tā vietā izvēlies tapered-curly-crop-long-top | 86fc3326 |  |
| long-top-side-swept-pixie.density_fit.low.note | lies flat, so add root lift | mati pieguļ galvai, tāpēc piešķir pacēlumu pie saknēm | 2eca2e25 |  |
| long-top-side-swept-pixie.density_fit.high.note | thin the top internally | izfilē virspuses iekšējos slāņus | db12dcec |  |
| long-top-side-swept-pixie.growth.note | A strong natural part direction makes this much easier to style. | Izteikts dabiskā celiņa virziens ievērojami atvieglo ieveidošanu. | 756fbf91 |  |
| long-top-side-swept-pixie.strand_note | Fine straight strands fall flat without root lift; thick strands need internal thinning on top. | Smalki, taisni mati bez pacēluma pie saknēm saplok; bieziem matiem virspusē nepieciešama iekšējā filēšana. | d627dd27 |  |
| long-top-side-swept-pixie.upkeep.products.0 | root-lift spray | sakņu pacelšanas sprejs | 97d186da |  |
| long-top-side-swept-pixie.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| long-top-side-swept-pixie.grow_out | Top grows into a full bixie as the sides fill in; trim only the perimeter. | Sāniem ataugot, augšdaļa pārtop par pilnvērtīgu bixie; pielīdzini tikai kontūru. | 72254224 |  |
| long-top-side-swept-pixie.client | Short on the sides with a long soft sweep on top. Part it deep, push it back or tuck it behind an ear. | Īsi sāni ar garu, maigi krītošu matu apjomu virspusē. Veido dziļu celiņu, atglaud atpakaļ vai aizliec aiz auss. | 1b12bd49 |  |
| long-top-side-swept-pixie.stylist | Keep a large connected top section and blend it into tight sides with scissor-over-comb or a clipper taper. Angle the front so the sweep ends at the cheekbone without a visible line. Weight: weight held in the top section; sides and back kept close. | Saglabā apjomīgu, savienotu augšdaļas sekciju un sapludini to ar īsiem sāniem, izmantojot šķēres pār ķemmi vai mašīnītes taper pāreju. Priekšpusi veido leņķī, lai uz sānu vērstā šķipsna beigtos pie vaigu kaula bez redzamas pārejas līnijas. Masa: apjoms saglabāts augšējā sekcijā; sāni un aizmugure veidoti īsi un pieguloši. | db6c4f85 |  |
| micro-pixie.name | Micro pixie | Micro pixie | 9bd5538e | same |
| micro-pixie.texture_fit.wavy.note | waves collapse at this length; keep the top near 3 cm | šādā garumā viļņi izjūk; atstāj virspusē apmēram 3 cm | 968ee8fb |  |
| micro-pixie.texture_fit.curly.note | cut dry so curls sit where they will land | griez sausos matos, lai cirtas iegultu dabiski | 19a755dc |  |
| micro-pixie.texture_fit.coily.note | see Tapered TWA for the shaped version | skaidrākai formai skaties Tapered TWA | e69ff8ca |  |
| micro-pixie.density_fit.high.note | very thick hair turns dense and puffy; ask for tapering | ļoti biezi mati kļūst pārāk blīvi un uzpūsti; palūdz izveidot pakāpenisku pāreju | 2058b537 |  |
| micro-pixie.growth.note | Bares the hairline fully, so hair that sits higher at the temples and a nape whorl are on display. | Pilnībā atsedz matu augšanas līniju, tāpēc augstāki deniņi un matu virpulis uz kakla būs labi redzami. | 50831205 |  |
| micro-pixie.strand_note | Short length makes strand thickness obvious: coarse hair feels spiky, fine hair looks sleek. | Īss garums izceļ matu biezumu: raupji mati šķiet spuraini, smalki mati izskatās gludi. | 1434ce5b |  |
| micro-pixie.upkeep.products.0 | light pomade | vieglas fiksācijas pomāde | ccc6c968 |  |
| micro-pixie.upkeep.products.1 | matte clay | matēts māls | 37b1eb2f |  |
| micro-pixie.grow_out | The grow-out passes through a pixie and bixie stage; plan on a few awkward weeks. | Ataugot mati iziet cauri pixie un bixie posmam; rēķinies ar dažām nepateicīgām nedēļām. | e19b95aa |  |
| micro-pixie.client | Very short with almost no styling, so the cheekbones and eyes are on show. | Ļoti īss griezums, kam ieveidošana gandrīz nav vajadzīga, tāpēc tas lieliski izceļ vaigu kaulus un acis. | 2810ae1b |  |
| micro-pixie.stylist | Clipper-over-comb the sides and back, then scissor the top just long enough to move. Check the hairline for cowlicks before choosing a guard. Weight: none; almost one short length with a soft taper. | Ar mašīnīti pār ķemmi apstrādā sānus un aizmuguri, tad ar šķērēm nogriez augšdaļu tieši tik garu, lai mati saglabātu kustību. Pirms uzgaļa izvēles pārbaudi, vai gar matu augšanas līniju nav virpuļu. Masa: nav; gandrīz vienmērīgs īss garums ar maigu pāreju. | 689f8c6c |  |
| undercut-pixie.name | Undercut pixie | Undercut pixie | 3459354e | same |
| undercut-pixie.fade.note | Clip the sides and nape to 3-10 mm below the parietal ridge. Leave a clean line to the longer top. | Noskuj sānus un pakausi līdz 3–10 mm zem parietālās līnijas. Atstāj skaidru pārejas līniju uz garāko virspusi. | 7d34f60e |  |
| undercut-pixie.texture_fit.curly.note | works with loose curls, tighten the undercut line for definition | piemērots vaļīgākām cirtām; izteiksmīgākam kontrastam veido stingrāku undercut līniju | a9fa4f56 |  |
| undercut-pixie.texture_fit.coily.note | keep the top 8+ cm so the curls can fall over the line | atstāj virspusē vismaz 8 cm, lai cirtas kristu pāri līnijai | 10afef74 |  |
| undercut-pixie.density_fit.low.note | fine hair loses volume when the sides go, keep sides moderate | smalki mati zaudē apjomu, ja sānus nogriež par īsu, tāpēc saglabā mērenāku sānu garumu | cfbced0c |  |
| undercut-pixie.density_fit.high.note | removes bulk and gives thick hair a clear weight break | noņem lieko biezumu un veido skaidru atdalījuma līniju biezos matos | 71967057 |  |
| undercut-pixie.growth.note | Needs a clear nape and ear-edge; a double crown can pull the line out of place. | Nepieciešama tīra kakla un ausu līnija; dubults virpulis pakausī var izjaukt līniju. | 42da21bc |  |
| undercut-pixie.strand_note | Coarse or thick strands stand over a disconnected line; fine strands drape and can look flat. | Raupji vai biezi mati labi turas virs asās pārejas līnijas; smalki mati pieguļ un var izskatīties pieplakuši. | 4eff0887 |  |
| undercut-pixie.upkeep.products.0 | strong wax | stipras fiksācijas vasks | b27c9316 |  |
| undercut-pixie.upkeep.products.1 | styling paste | ieveidošanas pasta | 90f82073 |  |
| undercut-pixie.grow_out | Grow the undercut out gradually; it becomes an ear-length pixie in about 3 months. | Audzē undercut pakāpeniski; apmēram 3 mēnešu laikā tas pārtaps par pixie līdz ausīm. | f8426871 |  |
| undercut-pixie.client | Very short sides and nape with a longer top you can sweep to the side, forward or back. Bold, and it lets thick hair breathe. | Ļoti īsi sāni un pakausis ar garāku virspusi, ko vari veidot uz sānu, uz priekšu vai atpakaļ. Drosmīgs griezums, kas ļauj bieziem matiem elpot. | ee4e863b |  |
| undercut-pixie.stylist | Use a guard to set a clean horizontal line at the parietal ridge, then connect or deliberately disconnect with a razor. Offer a shorter undercut that can be covered when the top lies flat. Weight: a strong line between short sides and the longer top. | Ar mašīnītes uzgali izveido precīzu horizontālu līniju pie parietālā izliekuma, pēc tam savieno vai apzināti atdali sekcijas ar bārdasnazi. Piedāvā īsāku undercut, ko var nosegt, kad augšējie mati brīvi nolaisti pāri. Masa: izteikta līnija starp īsajiem sāniem un garāko augšdaļu. | 940beae6 |  |
| bixie.name | Bixie | Bixie | 0acfeee2 | same |
| bixie.texture_fit.curly.note | sits well on 3A-3B curls, keep the layers long and unbroken | labi izskatās 3A–3B cirtās; saglabā garas un plūstošas pakāpes | a2a68eba |  |
| bixie.texture_fit.coily.note | needs a clear shape because shrinkage moves the length up | nepieciešama skaidra forma, jo saraušanās dēļ mati izskatās īsāki | 7125a41c |  |
| bixie.density_fit.low.note | keep the nape layers soft | veido maigas pakāpes pakausī | 81268714 |  |
| bixie.density_fit.high.note | add internal layers; thick hair swells at the sides | veido iekšējās pakāpes; biezi mati sānos mēdz uzpūsties | 8d2f0e76 |  |
| bixie.growth.note | Check the crown and front hairline since the top layers sit close to them. | Pārbaudi galvvidu un priekšējo matu augšanas līniju, jo augšējās kārtas pieguļ tieši tām. | 2da92e2c |  |
| bixie.strand_note | Fine hair stays fuller than in a blunt bob; thick hair needs weight removed above the ears. | Smalki mati saglabā vairāk apjoma nekā taisnajā bobā; bieziem matiem nepieciešams noņemt smagumu virs ausīm. | 44d36d08 |  |
| bixie.upkeep.products.0 | texturising spray | teksturējošs sprejs | 1544201e |  |
| bixie.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| bixie.grow_out | An easy path to a full chin bob; trim the nape every few months. | Vienkāršs ceļš līdz pilnvērtīgam zoda garuma bobam; ik pēc dažiem mēnešiem pielīdzini kakla līniju. | bc52ceb6 |  |
| bixie.client | A cut between a pixie and a bob: short at the neck, softly longer around the face. | Griezums starp pixie un bobu: īss pie kakla, maigi pagarināts ap seju. | b92c1194 |  |
| bixie.stylist | Take the sides to the jaw with a slight curve, then cut a short feathered graduation through the back so the length is off the neck but not clipped. Weight: weight held at the jaw in front, tapered at the nape. | Veido sānus līdz žokļa līnijai ar vieglu izliekumu, pēc tam aizmugurē izveido īsu, pludinātu gradāciju, lai garums neskartu kaklu, bet nebūtu nogriezts ar mašīnīti. Svars: masa koncentrēta priekšpusē pie žokļa, ar pāreju kakla daļā. | 1d79e0fe |  |
| shaggy-pixie.name | Shaggy pixie | Shaggy pixie | 166f52ec | same |
| shaggy-pixie.texture_fit.curly.note | Curls from 2C to 3B take shape on their own; a diffuser helps | Cirtas no 2C līdz 3B iegulst pašas; palīdz difuzors | 9442cf2b |  |
| shaggy-pixie.texture_fit.coily.note | choose curly-short-shag | izvēlies curly-short-shag | 7f8a66e9 |  |
| shaggy-pixie.density_fit.low.note | avoid heavy razoring, it leaves ends see-through | izvairies no agresīvas filēšanas ar žileti, citādi gali kļūst caurspīdīgi | bea16e7c |  |
| shaggy-pixie.density_fit.high.note | thin the sides only | izfilē tikai sānus | b22af50f |  |
| shaggy-pixie.growth.note | Check the crown for swirls since the longer top layers show them. | Pārbaudi virpuļus pakausī, jo garākās augšējās kārtas tos izcels. | 9ef137c4 |  |
| shaggy-pixie.strand_note | Fine strands look wispy at the ends; coarse strands stay chunky and need point cutting. | Smalkiem matiem gali izskatās gaisīgi; raupji mati paliek smagnēji, tāpēc nepieciešams point cutting griezums. | 17fa2b17 |  |
| shaggy-pixie.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| shaggy-pixie.upkeep.products.1 | texturising paste | teksturējoša pasta | 5811656a |  |
| shaggy-pixie.grow_out | Layers merge into a soft shag within 2 months. | 2 mēnešu laikā pakāpes saplūst vieglā shag griezumā. | bc0ddcd9 |  |
| shaggy-pixie.client | A messy short cut with soft pieces and movement. It softens into a short shag as it grows. | Rotaļīgi nekārtīgs, īss griezums ar maigām šķipsnām un kustību. Ataugot tas dabiski pārtop par īsu shag griezumu. | 6824a0ba |  |
| shaggy-pixie.stylist | Point cut and slide cut through the interior to break the line, and keep the sides slightly longer than a classic pixie so they blend with the top. Weight: movement and weight at the crown; ends broken and wispy. | Griez iekšējo formu ar point cut un slide cut tehniku, lai izjauktu stingro līniju, un atstāj sānus nedaudz garākus nekā klasiskajam pixie, lai tie saplūstu ar augšdaļu. Svars: kustība un masa pakausī; gali gaisīgi un izretināti. | 0da13141 |  |
| baby-bang-pixie.name | Baby-fringe pixie | Pixie ar mikro priekšmatiem | dada3555 |  |
| baby-bang-pixie.texture_fit.curly.note | the fringe springs up and shrinks to the hairline | priekšmati saraujas un paceļas līdz pat matu augšanas līnijai | 772eb40c |  |
| baby-bang-pixie.texture_fit.coily.note | a micro fringe shrinks to the hairline on coils; see tapered-twa | sīkām cirtām mikro priekšmati saraujas līdz matu augšanas līnijai; skaties tapered-twa | 319e2a6f |  |
| baby-bang-pixie.density_fit.high.note | a very thick fringe looks heavy, thin lightly | ļoti biezi priekšmati izskatās smagnēji, viegli tos izfilē | b215477c |  |
| baby-bang-pixie.growth.note | Needs a stable frontal hairline; a cowlick at the front makes the short fringe stand. | Nepieciešama vienmērīga matu augšanas līnija pie pieres; virpulis priekšpusē liks īsajiem priekšmatiem celties stāvus. | db6047d4 |  |
| baby-bang-pixie.strand_note | Fine fringe lies flat and see-through; coarse fringe may stand away from the forehead. | Smalki priekšmati pieguļ un ir caurspīdīgi; raupji mati var celties nost no pieres. | 0768ff81 |  |
| baby-bang-pixie.upkeep.products.0 | light wax | viegls vasks | 94347f09 |  |
| baby-bang-pixie.grow_out | The fringe reaches brow length in 4-6 weeks; the pixie follows. | Priekšmati sasniedz uzacu garumu 4–6 nedēļās; pārējais griezums seko līdzi. | 539c8524 |  |
| baby-bang-pixie.client | A pixie with a tiny fringe above the brows. It looks bold, playful and graphic. | Pixie griezums ar pavisam īsiem priekšmatiem virs uzacīm. Izskatās drosmīgi, rotaļīgi un grafiski. | b0a4d851 |  |
| baby-bang-pixie.stylist | Cut the fringe dry and directionally, off the natural hairline. Leave it slightly uneven so it moves, and check against the brow for symmetry. Weight: little weight; the short fringe is the main feature. | Griez priekšmatus sausos matos to dabiskā krituma virzienā no matu augšanas līnijas. Atstāj tos nedaudz nevienmērīgus dzīvīgākai kustībai un pārbaudi simetriju pret uzacīm. Svars: minimāla masa; galvenais akcents ir īsie priekšmati. | b8be6a08 |  |
| asymmetric-pixie.name | Asymmetric pixie | Asimetriskais pixie | 6966026a |  |
| asymmetric-pixie.texture_fit.curly.note | cut dry on curl and keep the long side 2 cm longer | griez sausās cirtās un atstāj garāko pusi par 2 cm garāku | 5b5f99a7 |  |
| asymmetric-pixie.texture_fit.coily.note | see asymmetric-coily-taper | skatīt asymmetric-coily-taper | bac4d328 |  |
| asymmetric-pixie.density_fit.low.note | thin hair loses the asymmetry, use blunt edges | plāni mati zaudē asimetriju, tāpēc veido taisnas, stingras līnijas | d891ca03 |  |
| asymmetric-pixie.growth.note | Choose the long side to match the natural part; fighting it makes styling hard. | Izvēlies garāko pusi atbilstoši dabiskajam celiņam; veidojot pret dabisko virzienu, ieveidošana būs sarežģīta. | a99f74ea |  |
| asymmetric-pixie.strand_note | Coarse strands hold the line on the long side; fine strands blow around. | Raupji mati labi notur līniju garākajā pusē; smalki mati viegli izpūšas vējā. | 62ff05d1 |  |
| asymmetric-pixie.upkeep.products.0 | texture paste | tekstūras pasta | bd991657 |  |
| asymmetric-pixie.upkeep.products.1 | shine serum | spīduma serums | 4a1277ec |  |
| asymmetric-pixie.grow_out | As it grows, even out the sides and move toward a bixie. | Matiem ataugot, nolīdzini sānus un pārej uz bixie griezumu. | 97466e54 |  |
| asymmetric-pixie.client | A short cut with one longer side that gives a modern, edgy balance. | Īss griezums ar vienu garāku pusi, kas piešķir mūsdienīgu, izteiksmīgu koptēlu. | 2668942b |  |
| asymmetric-pixie.stylist | Set the part first, build length and angle on the heavier side, and graduate the opposite side. Check symmetry at eye level from the front. Weight: one side kept longer, the other short; weight sits off-centre. | Vispirms iezīmē celiņu, veido garumu un leņķi smagākajā pusē un izveido gradāciju pretējā pusē. Pārbaudi simetriju no priekšpuses acu līmenī. Svars: viena puse atstāta garāka, otra īsa; masa nobīdīta no centra. | 93dc0a73 |  |
| pixie-mullet.name | Pixie mullet | Pixie mullet | dbd4e733 | same |
| pixie-mullet.texture_fit.curly.note | keep the nape moist and leave 2 cm more at the back | turi matus pakausī mitrus un aizmugurē atstāj par 2 cm vairāk garuma | f989f955 |  |
| pixie-mullet.texture_fit.coily.note | retain extra length in the nape for shrinkage | pakauša daļā atstāj papildu garumu, ierēķinot saraušanos | 33214f8b |  |
| pixie-mullet.growth.note | Check nape growth patterns and the crown whorl before leaving the nape long. | Pirms atstāj garākus matus uz kakla, pārbaudi augšanas virzienu pie kakla līnijas un virpuli pakausī. | 2203c277 |  |
| pixie-mullet.strand_note | Fine strands on the back flip if cut too thin; coarse strands add attitude. | Pārāk plāni nogriezti smalki mati aizmugurē uzlokās uz āru; raupji mati piešķir raksturu. | b30145ed |  |
| pixie-mullet.upkeep.products.0 | texturising paste | teksturējoša pasta | 5811656a |  |
| pixie-mullet.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| pixie-mullet.grow_out | Let the back grow and it turns into a wolf cut. | Ļaujot aizmugurei ataugt, tas pārtop par wolf cut griezumu. | 90df6048 |  |
| pixie-mullet.client | Short around the face and top with a longer soft tail at the back. | Īss ap seju un virspusē, ar garāku, maigi krītošu matu daļu aizmugurē. | fb88d25a |  |
| pixie-mullet.stylist | Create a clear contrast between the top and nape sections, disconnect with a razor or point cut, and keep the tail soft rather than blunt. Weight: the back is left longer than the top and sides; weight falls at the nape. | Izveido skaidru kontrastu starp augšdaļu un kakla zonu, atdali sekcijas ar nazi vai point cut tehniku un veido aizmugurējo asti mīkstu, nevis taisni nogrieztu. Svars: aizmugure atstāta garāka par augšdaļu un sāniem; masa koncentrējas uz kakla. | c0897570 |  |
| curly-pixie.name | Curly pixie | Curly pixie | 946342db | same |
| curly-pixie.texture_fit.straight.note | the shape depends on curl, so use classic-pixie | forma balstās uz cirtām, tāpēc izvēlies classic-pixie | bb56fd3e |  |
| curly-pixie.texture_fit.coily.note | for tight coils see tapered-curly-crop-long-top | sīkām cirtām skaties tapered-curly-crop-long-top | 3691f3e8 |  |
| curly-pixie.density_fit.low.note | fine curls can look thin when short, so leave the top fuller | smalkas cirtas īsā griezumā var izskatīties retas, tāpēc virspusi atstāj kuplāku | cebbbad7 |  |
| curly-pixie.growth.note | A nape whorl needs a careful taper, because short curls follow the whorl direction. | Matu virpulim pie kakla līnijas nepieciešama rūpīga pāreja, jo īsas cirtas iegulsies virpuļa virzienā. | 84284e9a |  |
| curly-pixie.strand_note | Thick curls hold the shape well; fine curls need density on top and a light taper. | Biezas cirtas labi tur formu; smalkām cirtām nepieciešams biezums virspusē un viegla pāreja. | 508399b0 |  |
| curly-pixie.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-pixie.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| curly-pixie.grow_out | Grows into a curly bixie; the top can be left alone while the nape is tidied. | Ataug par cirtainu bixie; augšdaļu var neaiztikt, pielīdzinot vien kakla līniju. | 7028f084 |  |
| curly-pixie.client | A short, curly cut with the curls left to bounce on top. | Īss, cirtains griezums, kur virspusē saglabāts cirtu vieglums un atsperīgums. | bdafa9d1 |  |
| curly-pixie.stylist | Cut dry curl by curl on top, leaving 2-3 cm more than the final result, and taper the sides and nape with scissors or a clipper. Check the shrink factor before you decide the length. Weight: curls are left longer on top and tapered close at the nape and sides. | Griez sausos matos cirtu pa cirtai augšpusē, atstājot par 2–3 cm vairāk par vēlamo gala garumu, un ar šķērēm vai mašīnīti izveido taper pāreju sānos un uz kakla. Pirms garuma izvēles ņem vērā cirtu saraušanos. Svars: cirtas atstātas garākas augšpusē, ar īsu, piegulošu pāreju sānos un uz kakla. | fe512c3e |  |
| curly-bixie.name | Curly bixie | Curly bixie | 98919b41 | same |
| curly-bixie.texture_fit.straight.note | use bixie | izvēlies bixie | cdf6b281 |  |
| curly-bixie.texture_fit.coily.note | keep the nape longer for 4A-4B curls and plan trims around shrinkage | 4A–4B cirtām atstāj pakausi garāku un plāno aplīdzināšanu, ņemot vērā saraušanos | 99cc41c0 |  |
| curly-bixie.density_fit.high.note | thin the sides only if the hair is very dense | izfilē sānus tikai tad, ja mati ir ļoti biezi | 0490da58 |  |
| curly-bixie.growth.note | A nape whorl can push curls outward, so leave the nape slightly longer. | Virpulis pie kakla līnijas var izspiest cirtas uz āru, tāpēc atstāj kakla daļu nedaudz garāku. | 0e6a7976 |  |
| curly-bixie.strand_note | Medium to thick curls give the best volume; fine curls need more weight at the jaw. | Vidējas līdz biezas cirtas veido vislabāko apjomu; smalkām cirtām vajag vairāk smaguma pie žokļa līnijas. | 4fcc2a32 |  |
| curly-bixie.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-bixie.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| curly-bixie.grow_out | Grows into a curly bob without losing its rounded shape. | Ataug par cirtainu bobu, nezaudējot noapaļoto formu. | c5e46c45 |  |
| curly-bixie.client | A short curly cut between a pixie and a bob. | Īss, cirtains griezums starp pixie un bobu. | 863301c1 |  |
| curly-bixie.stylist | Cut dry, section by section, allow for shrinkage and keep the front longer so the curl frames the face. Weight: rounded weight at the jaw and crown, with a shorter nape. | Griez sausos matos, šķipsnu pa šķipsnai, ņemot vērā saraušanos, un atstāj priekšpusi garāku, lai cirtas ierāmētu seju. Svars: noapaļots apjoms pie žokļa un pakausī, ar īsāku kakla daļu. | eb66104a |  |
| quiff-classic.name | Classic quiff | Klasiskais quiff | 84f7548b |  |
| quiff-classic.fade.note | Tapered sides, graduated into a quiff top. | Sāni ar taper pāreju, kas plūstoši pāriet quiff virspusē. | 4e2c13ec |  |
| quiff-classic.sideburns | Mid-length, tapered | Vidēja garuma, ar taper pāreju | ad7ffa4d |  |
| quiff-classic.texture_fit.wavy.note | Dry with the quiff direction. | Žāvē virzienā, kurā veido quiff. | a7f67daf |  |
| quiff-classic.texture_fit.curly.note | Use blow-dry and cream to avoid frizz. | Žāvē ar fēnu un lieto matu krēmu, lai novērstu pūkošanos. | a0594a02 |  |
| quiff-classic.texture_fit.coily.note | Needs relaxed or very loose coils; consider a high-top instead. | Nepieciešamas taisnotas vai ļoti vaļīgas cirtas; labāk apsver high-top. | 168d799c |  |
| quiff-classic.density_fit.low.note | Keep the front shorter and blow-dry with a volumising product. | Atstāj priekšpusi īsāku un žāvē ar fēnu, lietojot apjomu piešķirošu līdzekli. | 8cc77a09 |  |
| quiff-classic.growth.whorl_note | Crown whorl may twist the quiff to one side. | Virpulis pakausī var novirzīt quiff uz vienu pusi. | fdc6f7cc |  |
| quiff-classic.growth.note | Brushing up highlights the front hairline; avoid beyond stage 3. | Ķemmējot matus uz augšu, tiek izcelta priekšējā matu līnija; izvairies pēc 3. stadijas. | 65e1cf9b |  |
| quiff-classic.density_note | Medium to thick; thin hair collapses at the front. | Vidēji biezi līdz biezi mati; plāni mati priekšpusē saplok. | 0f26378e |  |
| quiff-classic.glasses_note | Raised front adds to apparent forehead height; thick frames balance. | Uz augšu pacelti priekšējie mati vizuāli pagarina pieri; biezi briļļu rāmji palīdz to līdzsvarot. | 8f1d47c7 |  |
| quiff-classic.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| quiff-classic.upkeep.products.1 | hair dryer | fēns | 042107b1 |  |
| quiff-classic.upkeep.products.2 | light hairspray | viegla matu laka | c75517c0 |  |
| quiff-classic.grow_out | Becomes a pompadour or flow in 8-10 weeks. | 8–10 nedēļu laikā pārtop par pompadour vai flow griezumu. | 9606482e |  |
| quiff-classic.client | Lifted front brushed up and slightly back, with tidy sides. Needs a bit of styling time. | Pacelta priekšpuse, kas fēnota uz augšu un nedaudz atpakaļ, ar koptiem sāniem. Prasa nedaudz laika ieveidošanai. | 35429414 |  |
| quiff-classic.stylist | Leave front 8-10 cm, thin out sides, graduate to the crown. Dry with a brush from the front back. | Priekšpusē atstāj 8–10 cm, sānus izretini, veido gradāciju virzienā uz pakausi. Žāvē ar suku virzienā no pieres uz aizmuguri. | 2a3d793f |  |
| quiff-textured-messy.name | Textured quiff | Teksturēts quiff | dcbb7b95 |  |
| quiff-textured-messy.fade.note | Low taper with a loose, piecey top. | Zema taper pāreja ar brīvu, šķipsnās izceltu virspusi. | 044c831b |  |
| quiff-textured-messy.sideburns | Tapered | Ar taper pāreju | dcbacddd |  |
| quiff-textured-messy.texture_fit.wavy.note | Natural movement does the work. | Dabiskā matu kustība izdara visu darbu. | 1fd79f57 |  |
| quiff-textured-messy.texture_fit.curly.note | Great with curl cream and diffuser. | Lieliski izskatās ar krēmu cirtām un difuzoru. | 18435a19 |  |
| quiff-textured-messy.texture_fit.coily.note | Use fingers to lift; shorten 1-2 cm. | Pacel ar pirkstiem; saīsini par 1–2 cm. | e0f12d2e |  |
| quiff-textured-messy.density_fit.low.note | Use texturising powder at the roots. | Iestrādā teksturējošo pūderi pie saknēm. | 39ba8e64 |  |
| quiff-textured-messy.growth.whorl_note | Texture covers cowlicks. | Tekstūra nomaskē virpuļus. | f33af5b3 |  |
| quiff-textured-messy.growth.note | Messier texture covers mild recession up to stage 3. | Nekārtīgāka tekstūra nomaskē nelielu matu atkāpšanos līdz pat 3. stadijai. | 37d969b7 |  |
| quiff-textured-messy.density_note | Medium; fine hair needs powder. | Vidēji biezi; smalkiem matiem nepieciešams pūderis. | f9a21878 |  |
| quiff-textured-messy.glasses_note | Casual styling with most frames. | Brīvs stils, kas piestāv lielākajai daļai rāmju. | e840c153 |  |
| quiff-textured-messy.upkeep.products.0 | clay | matu māls | 06363555 |  |
| quiff-textured-messy.upkeep.products.1 | salt spray | sāls sprejs | c60ddfa7 |  |
| quiff-textured-messy.grow_out | Easy; continues to a flow. | Viegli ataug; dabiski pāriet flow stilā. | 71d65e92 |  |
| quiff-textured-messy.client | A relaxed, lifted top with a lived-in finish. Less polished than a classic quiff. | Brīva, pacelta virspuse ar dabisku, nepiespiestu efektu. Nav tik noslīpēts kā klasiskais quiff. | 6219d4a7 |  |
| quiff-textured-messy.stylist | Point cut for movement; razor in the lengths for a messy outline. Blend sides with a clipper. | Veido point cut kustībai; apstrādā garumus ar nazi nekārtīgākai kontūrai. Sapludini sānus ar mašīnīti. | 6e9e579e |  |
| pompadour-classic.name | Classic pompadour | Klasiskais pompadour | 01d69a29 |  |
| pompadour-classic.fade.note | Scissor-over-comb or clipper taper; the short sides contrast with a high top. | Pāreja ar šķērēm pāri ķemmei vai ar mašīnīti; īsie sāni kontrastē ar augsto virspusi. | 8ec9b779 |  |
| pompadour-classic.sideburns | Medium-length, squared | Vidēja garuma, taisnas | f050e659 |  |
| pompadour-classic.texture_fit.wavy.note | Add heat for lift. | Izmanto fēna siltumu apjomam pie saknēm. | 28bf1839 |  |
| pompadour-classic.texture_fit.curly.note | Longer length (8 cm+) and a blow-dry are essential. | Nepieciešams vismaz 8 cm garums un žāvēšana ar fēnu. | 25fac159 |  |
| pompadour-classic.texture_fit.coily.note | Needs relaxed texture or a different design. | Nepieciešama taisnota tekstūra vai cits griezuma risinājums. | dd898542 |  |
| pompadour-classic.density_fit.low.note | A classic pompadour needs thick hair for its height; a textured quiff is closer. | Klasiskajam pompadour vajag biezus matus, lai iegūtu vajadzīgo augstumu; teksturēts quiff būs piemērotāks. | 336335bb |  |
| pompadour-classic.growth.whorl_note | Crown thinning is exposed by the back-comb. | Ķemmējot matus atpakaļ, atsedzas matu izretināšanās pakausī. | 3dc5ae65 |  |
| pompadour-classic.growth.note | Brushes the front back; exposes recession; not for stage 3+. | Ķemmējot priekšējos matus atpakaļ, atsedzas atkāpusies matu līnija; nav piemērots no 3. stadijas. | 76e9bd23 |  |
| pompadour-classic.density_note | Needs thick density for volume; thin hair is a poor candidate. | Apjomam nepieciešami biezi mati; plāniem matiem šis griezums nav piemērots. | d58e9a2c |  |
| pompadour-classic.glasses_note | A high wave makes the forehead look taller; chunky frames suit. | Augstais vilnis vizuāli pagarina pieri; labi piestāv masīvi rāmji. | 19d40278 |  |
| pompadour-classic.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| pompadour-classic.upkeep.products.1 | hair dryer | fēns | 042107b1 |  |
| pompadour-classic.upkeep.products.2 | hairspray | matu laka | fc47af4d |  |
| pompadour-classic.grow_out | Takes months to grow back. | Lai ataudzētu, nepieciešami vairāki mēneši. | 68be433e |  |
| pompadour-classic.client | A big wave swept up and back with tight sides. Takes time to style; always draws attention. | Apjomīgs vilnis, kas pacelts un atglausts atpakaļ, ar īsiem sāniem. Prasa laiku ieveidošanai un vienmēr piesaista uzmanību. | 8bc260d4 |  |
| pompadour-classic.stylist | Hold 10-12 cm at the front, graduate back; sides clipped tight. Blow-dry upward, comb back and hold with a strong pomade. Neat taper, sometimes blocked. | Priekšpusē atstāj 10–12 cm, veido gradāciju uz aizmuguri; sānus nogriez īsus ar mašīnīti. Žāvē ar fēnu virzienā uz augšu, ķemmē atpakaļ un nofiksē ar stipras fiksācijas pomādi. Veic kārtīgu taper pāreju, reizēm ar taisnu kakla apmali. | da5ea1bc |  |
| pompadour-modern.name | Modern pompadour with fade | Modernais pompadūrs ar fade | 6c022aa9 |  |
| pompadour-modern.fade.note | Mid skin fade with a higher top. | Mid skin fade ar augstāku virspusi. | fbdc93f4 |  |
| pompadour-modern.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| pompadour-modern.texture_fit.curly.note | Use curl cream and diffuse; keep top 7+ cm. | Lieto cirtu krēmu un žāvē ar difuzoru; virspusē atstāj vismaz 7 cm. | cc0038de |  |
| pompadour-modern.texture_fit.coily.note | Use a high-top form instead of back-combing. | Uzkasīšanas vietā veido high-top formu. | daf341ae |  |
| pompadour-modern.density_fit.low.note | Keep the front lower and use a volumising pre-styler. | Atstāj priekšpusi zemāku un pirms žāvēšanas lieto apjomu piešķirošu līdzekli. | dddef86b |  |
| pompadour-modern.growth.whorl_note | Crown thinning shows through the swept hair. | Caur atpakaļ atsukātajiem matiem būs redzama matu izretināšanās pakausī. | b5b11afc |  |
| pompadour-modern.growth.note | Exposes the temples when brushed back; keep front slightly forward for stage 3. | Ķemmējot matus atpakaļ, tiek atsegti deniņi; 3. stadijā veido priekšējos matus nedaudz uz priekšu. | cda9a1d0 |  |
| pompadour-modern.density_note | Needs medium to thick density to hold the shape; fine hair needs a strong spray. | Formas noturēšanai nepieciešami vidēji līdz biezi mati; smalkiem matiem vajadzīga stipras fiksācijas laka. | d37fe0c4 |  |
| pompadour-modern.glasses_note | Raised front pairs with bold frames. | Pacelta priekšpuse lieliski sader ar izteiksmīgiem rāmjiem. | 905a651e |  |
| pompadour-modern.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| pompadour-modern.upkeep.products.1 | texture powder | tekstūras pūderis | cbb5d0b2 |  |
| pompadour-modern.grow_out | Fade grows out in 3 weeks; top stays. | Fade ataug 3 nedēļās; augšdaļa saglabā formu. | 8af25098 |  |
| pompadour-modern.client | A tall, swept-back top over faded sides. Polished and bold, with daily styling. | Augsta, atpakaļ atglausta virspuse virs sāniem ar fade pāreju. Kopts un drosmīgs tēls, kas prasa ikdienas ieveidošanu. | 1bad20dc |  |
| pompadour-modern.stylist | Skin to #2 blend; leave 6-10 cm on top. Cut the top with a graduation that angles back and up. | Pāreja no skin fade līdz Nr. 2 uzgalim; augšpusē atstāj 6–10 cm. Griez augšdaļu gradācijā ar leņķi uz aizmuguri un augšu. | 76b6f74d |  |
| curly-quiff.name | Curly quiff | Cirtainais quiff | 2935756a |  |
| curly-quiff.fade.note | Mid fade or tight taper to emphasise the top volume. | Mid fade vai īsa taper pāreja, lai izceltu virspuses apjomu. | a0e564f6 |  |
| curly-quiff.sideburns | Faded or tapered | Ar fade vai taper pāreju | 2f8f5a06 |  |
| curly-quiff.texture_fit.straight.note | Not suited: choose a classic quiff. | Nav piemērots: izvēlies klasisko quiff. | 2aeb4987 |  |
| curly-quiff.texture_fit.wavy.note | Waves of 10 cm+ lift with a blow-dry. | Vismaz 10 cm gari viļņaini mati paceļas, žāvējot ar fēnu. | 2b5b6342 |  |
| curly-quiff.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-quiff.texture_fit.coily.note | Needs 10+ cm; style with a pick. | Nepieciešami vismaz 10 cm; ieveido ar afro matu ķemmi. | f48f4ec7 |  |
| curly-quiff.density_fit.low.note | Keep the front shorter so the curls hold their lift. | Atstāj priekšpusi īsāku, lai cirtas noturētu pacēlumu. | f9e52cf4 |  |
| curly-quiff.growth.note | Lifts the front; not advised past stage 3. | Paceļ priekšpusi; nav ieteicams pēc 3. stadijas. | 09aa72ad |  |
| curly-quiff.density_note | Medium to thick; fine curls collapse. | Vidēji biezi līdz biezi mati; smalkas cirtas saplok. | 89d76780 |  |
| curly-quiff.glasses_note | Raised front pairs with bold frames. | Pacelta priekšpuse lieliski sader ar izteiksmīgiem rāmjiem. | 905a651e |  |
| curly-quiff.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-quiff.upkeep.products.1 | light hold gel | vieglas fiksācijas želeja | 46121dca |  |
| curly-quiff.grow_out | It flows into a curly medium style in about 3 months. | Apmēram 3 mēnešu laikā tas pārtop par vidēja garuma cirtainu griezumu. | d9da4e28 |  |
| curly-quiff.client | Natural curls lifted at the front and kept short at the sides. Voluminous and confident. | Dabiski cirtaini mati ar paceltu priekšpusi un īsiem sāniem. Apjomīgs un pārliecinošs griezums. | 58fdbc42 |  |
| curly-quiff.stylist | Leave 10-13 cm at the front, graduate length to the back and fade the sides. Dry with a diffuser and pick the root lift. | Priekšpusē atstāj 10–13 cm, veido garuma gradāciju uz aizmuguri un fade sānos. Žāvē ar difuzoru un ar matu dakšu pacel matus pie saknēm. | 19b5b1ae |  |
| midi-shag.name | Shoulder-length shag | Shag līdz pleciem | 4f079dc8 |  |
| midi-shag.texture_fit.curly.note | cut dry and use a diffuser | griez sausos matos un žāvē ar difuzoru | 72a21988 |  |
| midi-shag.texture_fit.coily.note | cut layers slightly longer for tighter curls | ciešākām cirtām veido pakāpes nedaudz garākas | 6ab7689b |  |
| midi-shag.density_fit.low.note | fine hair becomes too thin when shattered, so keep it softly layered | pārāk izfilēti smalki mati kļūst pārāk plāni, tāpēc veido maigas pakāpes | 2d3213fe |  |
| midi-shag.growth.note | Crown layers will emphasise a double crown, so avoid stacking there. | Pakāpes galvvidū izcels dubulto virpuli, tāpēc šajā zonā izvairies veidot lieku apjomu. | d77b574c |  |
| midi-shag.strand_note | Medium to thick strands support heavy texture; fine strands need softer layers. | Vidēji un biezi mati labi notur izteiktu tekstūru; smalkiem matiem vajag maigākas pakāpes. | 5a3eac1c |  |
| midi-shag.upkeep.products.0 | texturising spray | teksturējošs sprejs | 1544201e |  |
| midi-shag.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| midi-shag.grow_out | Grows into a long shag with fewer trims needed. | Ataug par garu shag griezumu, ko var pielīdzināt retāk. | e96babf4 |  |
| midi-shag.client | A layered, shaggy cut that looks lived-in. It works well with waves and a curtain fringe. | Pakāpenisks, brīvs shag griezums ar dabisku efektu. Lieliski sader ar viļņiem un aizkarveida priekšmatiem. | 10ddcbf5 |  |
| midi-shag.stylist | Cut graduated layers at the crown and crown-to-ear line, then point cut for texture. Keep the lengths longer than a classic shag to keep a wearable shape. Weight: shorter, textured layers on top, long wispy lengths around the sides and back. | Griez graduētas pakāpes galvvidū un virzienā no galvvidus uz ausi, pēc tam veido tekstūru ar point cut tehniku. Garumu saglabā lielāku nekā klasiskajam shag, lai forma būtu viegli nēsājama ikdienā. Apjoms: īsākas, teksturētas pakāpes augšdaļā, gari un gaisīgi gali sānos un aizmugurē. | 8900b249 |  |
| classic-shag.name | Classic 70s shag | Klasiskais 70. gadu shag | 10f9adac |  |
| classic-shag.texture_fit.curly.note | keep the top layers longer on 3A curls | 3A cirtām atstāj augšējās pakāpes garākas | db925ac0 |  |
| classic-shag.texture_fit.coily.note | cut dry in the curl pattern; see Curly short shag | griez sausos matos pēc cirtu zīmējuma; skatīt Curly short shag | d46cb9ce |  |
| classic-shag.density_fit.low.note | very fine hair needs a lighter shag | ļoti smalkiem matiem vajag vieglāku shag griezumu | 59bff32d |  |
| classic-shag.growth.note | A crown whorl or cowlick complicates the short top layers. | Matu virpulis vai nepakļāvīgs matu augšanas virziens galvvidū var apgrūtināt īso virsējo pakāpju ieveidošanu. | eac0c1b5 |  |
| classic-shag.strand_note | Medium to thick strands give the shag its volume; fine strands look wispy. | Vidēji un biezi mati piešķir shag griezumam apjomu; smalki mati var izskatīties paplāni. | 63fcb39f |  |
| classic-shag.upkeep.products.0 | texturising spray | teksturējošs sprejs | 1544201e |  |
| classic-shag.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| classic-shag.grow_out | Grows into a long shag in about 3 months, and the layers stay useful the whole time. | Aptuveni 3 mēnešu laikā pāraug par garo shag, un pakāpes lieliski kalpo visu šo laiku. | 270aa042 |  |
| classic-shag.client | A heavily layered, shaggy cut with plenty of movement and volume at the crown. A 70s look that still reads cool. | Izteikti pakāpenisks, teksturēts griezums ar bagātīgu kustību un apjomu galvvidū. 70. gadu tēls, kas joprojām izskatās izcili stilīgi. | 9e655dfe |  |
| classic-shag.stylist | Cut short layers over the crown and top, graduate them through the sides and keep the nape long and thin. Point cut the ends so the layers separate. Weight: heavy layers on top and sides, with feathered, thinner ends. | Izveido īsas pakāpes galvvidū un augšdaļā, pakāpeniski pārej uz sāniem un kakla zonu atstāj garu un plānu. Griez galus ar point cut tehniku, lai pakāpes labi atdalītos. Apjoms: izteikts pakāpju smagums augšdaļā un sānos ar viegliem, filētiem un plānākiem galiem. | cbbaade4 |  |
| short-shag.name | Short shag | Īsais shag | 56ae021c |  |
| short-shag.texture_fit.curly.note | keep the top layers 1-2 cm longer so they do not stand upright | atstāj augšējās pakāpes par 1–2 cm garākas, lai tās neceltos stāvus | 7f426ea8 |  |
| short-shag.texture_fit.coily.note | cut dry in the curl pattern; Curly short shag is the full curl version | griez sausos matos pēc dabiskā cirtu zīmējuma; izteikti cirtainiem matiem paredzēts Curly short shag | 46909c49 |  |
| short-shag.density_fit.low.note | very fine hair looks wispy if every layer is shattered, so keep some solid length | ļoti smalki mati izskatās caurspīdīgi, ja katra pakāpe ir pārāk izfilēta, tāpēc jāsaglabā blīvāks pamatgarums | 2d06c80d |  |
| short-shag.density_fit.high.note | thick hair gives the shag its volume | biezi mati piešķir shag griezumam apjomu | 027195c1 |  |
| short-shag.growth.note | A crown whorl pushes the short top layers up, so leave them longer there. | Matu virpulis galvvidū paceļ īsās virsējās pakāpes, tāpēc tajā vietā atstāj tās garākas. | 3b3a3e2b |  |
| short-shag.strand_note | Medium to thick strands give the shag its lift; fine strands need softer layering. | Vidēji un biezi mati piešķir shag griezumam pacēlumu; smalkiem matiem nepieciešams maigāks pakāpeniskums. | 00c22fa0 |  |
| short-shag.upkeep.products.0 | texture spray | tekstūras sprejs | 9bf0ec6a |  |
| short-shag.upkeep.products.1 | light paste | viegla matu pasta | df055a9c |  |
| short-shag.grow_out | Becomes a shaggy bob within about 2 months without losing its shape. | Aptuveni 2 mēnešu laikā pārtop par shaggy bob, nezaudējot formu. | 4f9587c4 |  |
| short-shag.client | A cropped, shaggy cut with lots of texture on top and softly feathered sides. | Īss, teksturēts shag griezums ar izteiktu apjomu virspusē un viegli sapludinātām pārejām sānos. | 48a677bf |  |
| short-shag.stylist | Cut short layers over the crown on a high elevation, graduate through the sides, and point cut the ends for movement. Weight: weight stacked in the crown, with light feathered sides and nape. | Griez īsas pakāpes galvvidū ar augstu pacēluma leņķi, graduē uz sāniem un iestrādā galus ar point cut tehniku kustīgumam. Apjoms: apjoms koncentrēts galvvidū ar viegliem, filētiem sāniem un kakla daļu. | 008512f7 |  |
| chelsea-cut.name | Chelsea cut | Chelsea griezums | 2be6d8a5 |  |
| chelsea-cut.texture_fit.curly.note | use curly-short-shag instead | tā vietā izvēlies curly-short-shag | 42d6f655 |  |
| chelsea-cut.texture_fit.coily.note | use curly-short-shag instead | tā vietā izvēlies curly-short-shag | 42d6f655 |  |
| chelsea-cut.density_fit.low.note | fine hair becomes see-through when cut choppy | smalki mati kļūst caurspīdīgi, ja tos veido izteikti robainās šķipsnās | c78706ae |  |
| chelsea-cut.growth.note | The longer nape needs a clear hairline; low nape growth or whorls change the finish. | Garākai pakauša daļai nepieciešama tīra matu augšanas līnija; zema matu augšanas līnija uz kakla vai virpuļi maina koptēlu. | 1cf350b4 |  |
| chelsea-cut.strand_note | Coarse to medium strands hold the choppy texture best. | Raupji un vidēji biezi mati vislabāk notur robaino tekstūru. | 9ff17d41 |  |
| chelsea-cut.upkeep.products.0 | texture paste | tekstūras pasta | bd991657 |  |
| chelsea-cut.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| chelsea-cut.grow_out | Becomes a shaggy pixie and then a shag bob. | Pāraug par shaggy pixie un pēc tam par shag bob. | 6b2da450 |  |
| chelsea-cut.client | A cropped, choppy shag with a longer nape. It looks edgy and a little retro. | Īss, robains shag griezums ar garāku pakauša daļu. Izskatās drosmīgi un nedaudz retro. | 620973ba |  |
| chelsea-cut.stylist | Take the sides short, leave a longer back and crown, and cut the top with deep point cutting to produce short, separate pieces. Weight: choppy crown layers over cropped sides, with a longer wispy back. | Nogriez sānus īsus, atstāj garāku aizmuguri un galvvidu, un nogriez virspusi ar dziļu point cut tehniku, veidojot īsas, atsevišķi krītošas šķipsnas. Apjoms: izteiksmīgas pakāpes galvvidū virs īsiem sāniem ar garāku, gaisīgu aizmuguri. | d22f2a6b |  |
| long-shag.name | Long shag | Garais shag | 58861800 |  |
| long-shag.texture_fit.curly.note | cut dry in the curl pattern | griez sausos matos pēc dabiskā cirtu zīmējuma | 238a1d58 |  |
| long-shag.texture_fit.coily.note | see Curly long shag | skatīt Curly long shag | 314c19da |  |
| long-shag.density_fit.low.note | fine hair loses density at the thin ends, so keep the ends fuller | smalki mati zaudē blīvumu galos, tāpēc atstāj galus biezākus | 89160163 |  |
| long-shag.growth.note | Short crown layers highlight a double crown or cowlick. | Īsas pakāpes galvvidū izceļ dubulto virpuli vai nepakļāvīgu matu augšanas virzienu. | a83acc98 |  |
| long-shag.strand_note | Thick hair benefits from the layers; fine hair looks sparse if over-layered. | Bieziem matiem pakāpeniskums nāk par labu; smalki mati izskatīsies pārāk plāni, ja kārtu būs par daudz. | 09198ede |  |
| long-shag.upkeep.products.0 | texturising spray | teksturējošs sprejs | 1544201e |  |
| long-shag.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| long-shag.grow_out | Grows into a long layered cut as the crown layers lengthen, so only the face and top layers need refreshing every 10-12 weeks. | Galvvidus pakāpēm ataugot, tas pārtop par garu pakāpenisku griezumu, tāpēc tikai šķipsnas ap seju un virsējās pakāpes jāatsvaidzina ik pēc 10–12 nedēļām. | 204308f5 |  |
| long-shag.client | A long cut with plenty of shaggy layers on top. | Garš griezums ar bagātīgām, teksturētām kārtām virspusē. | 1d009510 |  |
| long-shag.stylist | Cut a high crown layer, graduate to the sides and keep length at the back. Weight: short crown layers merge into long, thin lengths. | Izveido augstu pakāpi galvvidū, graduē uz sāniem un saglabā garumu aizmugurē. Apjoms: īsas pakāpes galvvidū pakāpeniski saplūst ar gariem, plāniem matiem. | 894934bf |  |
| shaggy-lob.name | Shaggy lob | Shaggy lob | 4ac6732b | same |
| shaggy-lob.texture_fit.curly.note | cut dry and use a diffuser | griez sausos matos un žāvē ar difuzoru | 72a21988 |  |
| shaggy-lob.texture_fit.coily.note | cut dry and keep layers longer for curls | griez sausus matus un atstāj kārtas garākas, lai lokas glīti iegultos | 4e8d2a07 |  |
| shaggy-lob.density_fit.low.note | fine hair needs fewer layers | smalkiem matiem vajag mazāk kārtu | 2d503e0d |  |
| shaggy-lob.density_fit.high.note | thick hair gains movement | biezi mati iegūst kustību | b0c72508 |  |
| shaggy-lob.growth.note | Crown layers highlight a whorl, so keep the layers around it longer than elsewhere. | Galvvidus pakāpes izceļ virpuli, tāpēc ap to atstāj pakāpes garākas nekā citur. | 303a0f25 |  |
| shaggy-lob.strand_note | Medium to thick strands hold the layers; fine strands need a lighter touch. | Vidēji un biezi mati labi notur kārtas; smalkiem matiem nepieciešams maigāks griezums. | 9e8e8f0f |  |
| shaggy-lob.upkeep.products.0 | texturising spray | teksturējošs sprejs | 1544201e |  |
| shaggy-lob.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| shaggy-lob.grow_out | Grows into a midi shag as the perimeter lengthens, so the crown layers need refreshing before the ends do. | Matu pamatlīnijai ataugot, tas pārtop par midi shag, tāpēc galvvidus pakāpes jāatsvaidzina ātrāk nekā matu gali. | b78ec145 |  |
| shaggy-lob.client | A lob with shaggy layers that suit waves. | Lobs ar brīvām, teksturētām kārtām, kas lieliski izskatās viļņainos matos. | a4f7cb00 |  |
| shaggy-lob.stylist | Cut short crown layers over a collarbone base and point cut the ends. Weight: crown layers over a collarbone-length perimeter, with ends broken. | Izveido īsas galvvidus pakāpes virs atslēgas kaula garuma pamatlīnijas un iestrādā galus ar point cut tehniku. Apjoms: galvvidus pakāpes virs pamatlīnijas atslēgas kaula garumā ar viegli retinātiem galiem. | df15f548 |  |
| curly-short-shag.name | Curly short shag | Cirtains īsais shag | 38d6f57f |  |
| curly-short-shag.texture_fit.wavy.note | waves need styling to hold the volume | viļņainiem matiem nepieciešama ieveidošana, lai noturētu apjomu | e84eda43 |  |
| curly-short-shag.density_fit.low.note | fine curls can look sparse, so keep layers connected | smalkas lokas var izskatīties retas, tāpēc saglabā plūstošas pārejas starp kārtām | f88bca3e |  |
| curly-short-shag.growth.note | Crown whorls change how the curls spiral, so cut layers longer around them. | Virpuļi galvvidū maina loku vijumu, tāpēc ap tiem pakāpes jāgriež garākas. | 96359cc6 |  |
| curly-short-shag.strand_note | Dense curls give the volume; fine curls need soft layers. | Biezas lokas sniedz vajadzīgo apjomu; smalkām lokām vajadzīgas maigas kārtas. | 88ba5d08 |  |
| curly-short-shag.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-short-shag.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| curly-short-shag.grow_out | The crown layers lengthen into a curly shag bob; refresh the sides first, as they lose shape sooner. | Galvvidus pakāpēm ataugot, griezums pārtop par cirtainu shag bob; vispirms atjauno sānus, jo tie formu zaudē ātrāk. | 59f63800 |  |
| curly-short-shag.client | A short layered curly cut with plenty of volume. | Īss, pakāpenisks griezums cirtainiem matiem ar bagātīgu apjomu. | fe8be389 |  |
| curly-short-shag.stylist | Cut layers dry curl by curl, leaving the top fuller and feathering the sides. Weight: layered curls stacked in the crown with lighter sides and nape. | Griez pakāpes sausos matos, loku pa lokai, atstājot augšdaļu kuplāku un izfilējot sānus. Apjoms: daudzslāņainas lokas koncentrētas galvvidū ar vieglākiem sāniem un pakauša lejasdaļu. | a2eade2b |  |
| curly-long-shag.name | Curly long shag | Garais cirtainais shag | 413b2d6b |  |
| curly-long-shag.texture_fit.wavy.note | waves need styling | viļņainiem matiem vajadzīga ieveidošana | 2ae4dbde |  |
| curly-long-shag.density_fit.low.note | fine curls lose density in the ends, so keep the ends fuller | smalkas lokas zaudē blīvumu matu galos, tāpēc saglabā galus biezākus | 8e03abe6 |  |
| curly-long-shag.growth.note | Short crown layers highlight whorls and double crowns, so lengthen the layers around them. | Īsas galvvidus pakāpes izceļ virpuļus un dubulto virpuli, tāpēc ap tiem pakāpes atstāj garākas. | 2fa511bc |  |
| curly-long-shag.strand_note | Medium to thick curls form layers well; fine curls need fewer layers. | Vidēji un biezi cirtaini mati labi veido kārtas; smalkām lokām vajag mazāk kārtu. | f5832537 |  |
| curly-long-shag.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-long-shag.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| curly-long-shag.grow_out | The crown layers lengthen gradually into a long layered curl cut, so trims can be 12 weeks apart. | Galvvidus pakāpes pakāpeniski ataug par garu, daudzslāņainu loku griezumu, tāpēc pielīdzināt matus var reizi 12 nedēļās. | 34af3feb |  |
| curly-long-shag.client | Shaggy curls that land at the shoulders when dry, with shorter layers on top for volume and movement. Pulled straight, they reach the shoulder blades. | Teksturētas lokas, kas izžuvušas sniedzas līdz pleciem, ar īsākām kārtām virspusē apjomam un kustībai. Izstieptas taisni, tās sasniedz lāpstiņas. | 136a8c74 |  |
| curly-long-shag.stylist | Cut the crown layers dry, curl by curl, graduating to the length at the sides and back; keep the perimeter dense so the ends do not look thin. Weight: short crown layers over long curls, with feathered ends. Tight coils shrink more and land nearer the collarbone. | Griez galvvidus pakāpes sausos matos, loku pa lokai, pakāpeniski pārejot uz garumu sānos un aizmugurē; saglabā biezu apakšējo līniju, lai gali neizskatītos pārāk plāni. Apjoms: īsas galvvidus pakāpes virs garām lokām ar viegliem galiem. Ļoti sīkas cirtas sarausies vairāk un sniegsies tuvāk atslēgas kaulam. | 27e5f09e |  |
| fine-hair-wispy-shag.name | Wispy shag for fine hair | Gaisīgs shag smalkiem matiem | 9886305f |  |
| fine-hair-wispy-shag.texture_fit.curly.note | cut dry and keep layers long | griez sausos matos un atstāj garas pakāpes | 0965c92d |  |
| fine-hair-wispy-shag.texture_fit.coily.note | cut dry and keep extra length for shrinkage | griez sausus matus un atstāj papildu garumu, rēķinoties ar saraušanos | a07ad69f |  |
| fine-hair-wispy-shag.density_fit.high.note | too much layering for thick hair, choose midi-shag | bieziem matiem būs par daudz kārtu, labāk izvēlies midi-shag | 69b1fca0 |  |
| fine-hair-wispy-shag.growth.note | A crown whorl can give lift or a parting problem; layers there should be cut long. | Virpulis galvvidū var piešķirt lieku pacēlumu vai radīt nevēlamu celiņu, tāpēc pakāpes šajā zonā jāatstāj garākas. | 223f45b6 |  |
| fine-hair-wispy-shag.strand_note | Fine strands need layers that are long and soft, with ends left intact so the cut does not look sparse. | Smalkiem matiem nepieciešamas garas un maigas kārtas, saglabājot galus blīvus, lai griezums neizskatītos rets. | 390fc1b7 |  |
| fine-hair-wispy-shag.upkeep.products.0 | volumising mousse | apjoma putas | 07b4f2db |  |
| fine-hair-wispy-shag.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| fine-hair-wispy-shag.grow_out | Grows into a long layered cut with the same density at the ends. | Ataug par garu pakāpenisku griezumu, saglabājot vienmērīgu matu biezumu galos. | 401d63c4 |  |
| fine-hair-wispy-shag.client | A shaggy cut that gives fine hair body and movement without looking thin at the ends. | Teksturēts shag griezums, kas smalkiem matiem piešķir formu un kustību, neļaujot galiem izskatīties plāniem. | 570da62d |  |
| fine-hair-wispy-shag.stylist | Cut a few high layers at the crown, point cut only the face pieces and keep the perimeter blunt; avoid razoring. Weight: restrained crown layers with solid ends, so volume sits high and the perimeter stays full. | Izveido dažas augstas pakāpes galvvidū, iestrādā ar point cut tehniku tikai šķipsnas ap seju un saglabā taisnu apakšējo līniju; izvairies no žiletes izmantošanas. Apjoms: mērenas pakāpes galvvidū ar blīviem galiem, lai apjoms saglabātos augšā un matu apakšējā līnija paliktu bieza. | 35c7baa3 |  |
| shag-modern.name | Modern men's shag | Mūsdienīgs vīriešu shag | 9388abe7 |  |
| shag-modern.sideburns | Blended | Sapludinātas | 80749709 |  |
| shag-modern.texture_fit.wavy.note | A good fit. | Lieliski piemērots. | 5f82cd32 |  |
| shag-modern.texture_fit.curly.note | Cut dry to see curl. | Griez sausos matos, lai redzētu loku formu. | 39dc4f17 |  |
| shag-modern.texture_fit.coily.note | Short layers. | Īsas kārtas. | 5baf61f7 |  |
| shag-modern.density_fit.low.note | Use fewer, longer layers so it does not look wispy. | Veido mazāk un garākas kārtas, lai mati neizskatītos pārāk plāni. | 14bd625f |  |
| shag-modern.growth.note | Messy fringe covers stage 3. | Nevērīgi priekšmati nosedz 3. stadiju. | 95924218 |  |
| shag-modern.density_note | Medium; thin hair looks wispy. | Vidējs biezums; plāni mati izskatās caurspīdīgi. | 2d81b877 |  |
| shag-modern.glasses_note | Good, but trim around the ears so hair does not catch on frame arms. | Labi piemērots, taču ap ausīm mati jāpiegriež rūpīgāk, lai tie neķertos aiz briļļu kājiņām. | 1992d15b |  |
| shag-modern.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| shag-modern.upkeep.products.1 | paste | matu pasta | a2c183d5 |  |
| shag-modern.grow_out | Easy: let the layers grow and it merges into a flow. | Ļoti vienkārši: ļauj pakāpēm ataugt, un griezums dabiski saplūst kopā. | 0549651e |  |
| shag-modern.client | Layered mid-length hair with a lived-in, rock-style finish. Looks styled even when it is not. | Pakāpeniski griezti pusgari mati ar dabiski nevīžīgu, roķīgu akcentu. Izskatās ieveidoti pat tad, kad nav. | 07bb48bf |  |
| shag-modern.stylist | Use point cutting and razor work to build layers; keep weight at the crown and remove weight from the ends. | Veido pakāpes ar point cut un žiletes tehniku; saglabā apjomu galvvidū un atbrīvo no smaguma matu galus. | c0f3c910 |  |
| curly-shag.name | Curly shag | Cirtains shag | 88cdd1b2 |  |
| curly-shag.sideburns | Blended | Sapludinātas | 80749709 |  |
| curly-shag.texture_fit.straight.note | Not suited: use a modern shag. | Nav piemērots: labāk izvēlies mūsdienīgo shag. | fe97b6dc |  |
| curly-shag.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-shag.texture_fit.coily.note | Needs shorter layers; shape with a pick. | Nepieciešamas īsākas kārtas; piešķir formu ar afro ķemmi. | dcde6d8a |  |
| curly-shag.density_fit.low.note | Use fewer, longer layers so it does not look wispy. | Veido mazāk un garākas kārtas, lai mati neizskatītos pārāk plāni. | 14bd625f |  |
| curly-shag.growth.note | Curls cover temples at stage 3-4. | Lokas nosedz deniņus 3.–4. stadijā. | ef58fbb9 |  |
| curly-shag.density_note | Medium to thick; thin hair looks wispy. | Vidēji līdz biezi mati; plāni mati izskatās caurspīdīgi. | a1400eeb |  |
| curly-shag.glasses_note | Hair may curl or drop over the arms of glasses; trim a clean channel behind the ear if frames sit on top of the hair. | Mati var lokoties vai krist pāri briļļu kājiņām; aiz ausīm izveido tīru līniju, ja rāmis balstās uz matiem. | b7f64717 |  |
| curly-shag.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-shag.grow_out | Let the layers grow; it becomes a longer curly shag in about 4 months. | Ļauj pakāpēm ataugt – aptuveni 4 mēnešu laikā griezums pārtop par garāku curly shag. | a18c92f5 |  |
| curly-shag.client | Curly layers with a messy fringe. Soft, volume-rich and relaxed. | Cirtainas kārtas ar brīvi krītošiem priekšmatiem. Mīksts, apjomīgs un nepiespiests tēls. | 75ac8d3b |  |
| curly-shag.stylist | Cut dry in curl clumps, layer to prevent a pyramid shape and keep the perimeter at ear or collar. | Griez sausos matos pa loku šķipsnām, veido pakāpes, lai izvairītos no «piramīdas» formas, un saglabā pamatlīniju ausu vai apkakles augstumā. | 949cc2a5 |  |
| one-length-shoulder.name | One-length shoulder cut | Viena garuma griezums līdz pleciem | 22046f34 |  |
| one-length-shoulder.texture_fit.curly.note | allow 6-8 cm for spring. Expect a triangle shape unless some layers go inside. | rēķinies ar 6–8 cm saraušanos; veidosies trīsstūra forma, ja vien iekšpusē netiks izveidotas kārtas | 1c62c8e7 |  |
| one-length-shoulder.texture_fit.coily.note | needs layers, see curly-u-shape-long-layers | nepieciešams pakāpeniskums, skati curly-u-shape-long-layers | 81632b54 |  |
| one-length-shoulder.density_fit.high.note | take out weight inside, behind the ears | samazini apjomu iekšpusē aiz ausīm | 719770e2 |  |
| one-length-shoulder.growth.note | Shoulders kick the ends outward, so check how the ends fall when the head turns. | Pleci atliec matu galus uz āru, tāpēc pārbaudi, kā gali krīt, pagriežot galvu. | a2e8ad3f |  |
| one-length-shoulder.strand_note | Fine hair looks fuller on a single line; thick hair gets very wide at the base without debulking. | Smalki mati vienā taisnā līnijā izskatās biezāki; biezi mati apakšā kļūst pārāk kupli, ja netiek noņemts liekais biezums. | fed76e0e |  |
| one-length-shoulder.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| one-length-shoulder.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| one-length-shoulder.grow_out | Needs almost no change as it grows; trim every 10-12 weeks to keep the ends fresh. | Ataugot gandrīz neprasa korekcijas; aplīdzini galus ik pēc 10–12 nedēļām, lai tie saglabātos svaigi. | 7671a58c |  |
| one-length-shoulder.client | A simple, one-length cut that rests on the shoulders. Easy to tie back and easy to keep tidy. | Vienkāršs, viena garuma griezums līdz pleciem. Viegli saņemt astē un ērti uzturēt kārtībā. | c1c6343e |  |
| one-length-shoulder.stylist | Cut a level perimeter with the head upright, and check that the ends do not flick at the shoulder. Add a few interior layers only if the hair is dense. Weight: single weight line resting on the tops of the shoulders. | Griez taisnu pamatlīniju, turot galvu taisni, un pārbaudi, vai gali neatliecas pret pleciem. Nelielas iekšējās pakāpes veido tikai tad, ja mati ir biezi. Apjoms: viena izteikta smaguma līnija, kas gulstas tieši uz pleciem. | 5a25b0dc |  |
| feathered-shoulder-layers.name | Feathered shoulder layers | Gaisīgas kārtas līdz pleciem | cab946ba |  |
| feathered-shoulder-layers.texture_fit.curly.note | cut dry, curls need a longer top layer | griez sausus matus, lokām nepieciešama garāka virsējā kārta | aef8e4b8 |  |
| feathered-shoulder-layers.texture_fit.coily.note | keep layers long to avoid a pyramid shape | saglabā kārtas garas, lai izvairītos no piramīdas formas | b3f55a37 |  |
| feathered-shoulder-layers.density_fit.low.note | fine hair loses density with too many layers | smalki mati zaudē blīvumu, ja ir par daudz kārtu | cac4baa8 |  |
| feathered-shoulder-layers.growth.note | Crown layers show whorls and cowlicks. | Galvvidus pakāpēs labi pamanāmi matu virpuļi un nepakļāvīgi augšanas virzieni. | 43a3ebc7 |  |
| feathered-shoulder-layers.strand_note | Medium and fine strands feather best; coarse strands may stand out. | Vidēji biezi un smalki mati veido visglītāko gaisīgumu; raupji mati var izcelties un kļūt nepakļāvīgi. | 10db6239 |  |
| feathered-shoulder-layers.upkeep.products.0 | light mousse | vieglas fiksācijas putas | afc8a642 |  |
| feathered-shoulder-layers.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| feathered-shoulder-layers.grow_out | Grows into a long layered cut; the layers merge smoothly. | Ataug par garu pakāpenisku griezumu; pakāpes saplūst nemanāmi. | 1e617209 |  |
| feathered-shoulder-layers.client | A shoulder-length cut with soft layers that move and flip at the ends. Looks full without much effort. | Griezums līdz pleciem ar mīkstām kārtām, kas viegli kustas un galos rotaļīgi atliecas. Izskatās kupls bez liekām pūlēm. | 34f82277 |  |
| feathered-shoulder-layers.stylist | Cut a soft perimeter at the shoulders then add long layers around the face, finishing with a blend through the back. Weight: weight at the perimeter and layers feathered from the cheekbone out. | Izveido maigu pamatlīniju plecu garumā, tad pievieno garas pakāpes ap seju un nobeigumā vienmērīgi sapludini ar aizmuguri. Apjoms: smagums pamatlīnijā ar viegli filētām pakāpēm virzienā no vaigu kauliem uz āru. | a454a773 |  |
| u-shape-midi.name | U-shape layers, shoulder length | U veida pakāpenisks griezums līdz pleciem | db9af542 |  |
| u-shape-midi.texture_fit.curly.note | let curls fall into the U and cut dry so the curve follows the real curl pattern | ļauj lokām brīvi iegulties U formā un griez sausus matus, lai līnija sekotu dabiskajam loku zīmējumam | 5e76e58c |  |
| u-shape-midi.texture_fit.coily.note | keep the U shallow on tight curls, otherwise the shorter centre looks sparse | sīkām lokām veido lēzenu U līniju, citādi īsākā vidusdaļa izskatīsies pārāk plāna | 02a7763a |  |
| u-shape-midi.density_fit.low.note | skip short face layers on fine hair to keep the ends full | smalkiem matiem neveido īsas kārtas pie sejas, lai gali saglabātu biezumu | 03a2f75c |  |
| u-shape-midi.growth.note | Keep the curve shallow so the centre back does not drop into a point. | Veido lēzenu loku, lai aizmugures vidusdaļa nekļūtu spica. | ef77c9c9 |  |
| u-shape-midi.strand_note | A gentle U works with every strand size because the layers stay long and connected. | Maiga U forma piestāv jebkura biezuma matiem, jo kārtas saglabājas garas un savstarpēji plūstošas. | 230d9658 |  |
| u-shape-midi.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| u-shape-midi.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| u-shape-midi.grow_out | The U shape stays clean for months, so appointments can be spaced out. | U veida līnija saglabājas precīza mēnešiem ilgi, tāpēc vizītes pie friziera var plānot retāk. | 72ccf802 |  |
| u-shape-midi.client | A shoulder cut with a soft, rounded back and long layers. It looks full from behind and easy from the front. | Griezums līdz pleciem ar maigi noapaļotu mugurpusi un garām kārtām. No aizmugures tas izskatās biezs, bet no priekšpuses – viegls un nepiespiests. | 997bb60a |  |
| u-shape-midi.stylist | Shape the back perimeter in a gentle curve, 4-6 cm longer at the centre than at the sides, and keep the face layers long so they connect to the curve. Weight: back edge forms a gentle U with the longest point at the middle of the back. | Veido aizmugures pamatlīniju vieglā lokā, vidū atstājot par 4–6 cm garāku nekā sānos, un saglabā priekšējās pakāpes pietiekami garas, lai tās dabiski savienotos ar loku. Apjoms: aizmugures līnija veido maigu U formu ar garāko punktu muguras vidū. | 42d51a45 |  |
| c-curve-midi.name | C-curve layers, shoulder length | C veida pakāpenisks griezums līdz pleciem | 3a068c38 |  |
| c-curve-midi.texture_fit.curly.note | cut dry and let the natural curl direction set the curve | griez sausus matus un ļauj dabiskajam loku virzienam noteikt izliekumu | 8255db5b |  |
| c-curve-midi.texture_fit.coily.note | shape the ends for the curl instead of forcing an inward bend | pielāgo matu galus loku formai, nevis centies tos ar spēku ielocīt uz iekšu | 175b80a4 |  |
| c-curve-midi.density_fit.low.note | fine hair keeps the curve only with a small round brush | smalki mati noturēs izliekumu tikai tad, ja tos ieveidos ar mazu apaļo suku | 19fdf8f6 |  |
| c-curve-midi.density_fit.high.note | thick hair holds the C easily | biezi mati viegli notur C formu | b3a05299 |  |
| c-curve-midi.growth.note | Check how the nape hair falls because a nape whorl can push the C outward. | Pārbaudi, kā krīt mati pie kakla, jo virpulis šajā zonā var izlocīt C formu uz āru. | 907784c8 |  |
| c-curve-midi.strand_note | Medium strands keep an inward C longest; coarse strands spring back. | Vidēji biezi mati C izliekumu uz iekšu notur visilgāk; raupji mati tiecas atlekt atpakaļ. | cfe991fb |  |
| c-curve-midi.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| c-curve-midi.upkeep.products.1 | shine spray | spīduma sprejs | d0399526 |  |
| c-curve-midi.grow_out | The C relaxes into an ordinary layered midi after about 12 weeks. | Pēc aptuveni 12 nedēļām C izliekums atslābst, pārtopot par parastu vidēja garuma pakāpenisku griezumu. | fa06f622 |  |
| c-curve-midi.client | A shoulder-length cut with ends that curve under in a neat C. Polished and soft. | Griezums līdz pleciem ar matu galiem, kas glīti ieliecas C formā uz iekšu. Kopts un maigs tēls. | aa00fcaa |  |
| c-curve-midi.stylist | Angle the ends with a slightly diagonal fine point cut so they turn under. Cut the face layers long and blend them down through the back. Weight: ends are shaped to curl inward in a C, with soft long layers underneath. | Nogriez matu galus ar smalku point cut tehniku vieglā leņķī, lai tie liektos uz iekšu. Nogriez garas pakāpes ap seju un vienmērīgi sapludini tās uz aizmuguri. Apjoms: gali veidoti tā, lai iegultu C formā uz iekšu, ar maigām garajām pakāpēm apakšā. | 493dce2e |  |
| blowout-layers-90s.name | 90s blowout layers | 90. gadu blowout kārtas | 8090216f |  |
| blowout-layers-90s.texture_fit.curly.note | cut dry on 3A curls, layers must stay long | 3A tipa lokām griez sausus matus; kārtām jāpaliek garām | 075761dc |  |
| blowout-layers-90s.texture_fit.coily.note | needs heavy heat; see coily-layered-midi-stacked | nepieciešama intensīva karstā veidošana; skati coily-layered-midi-stacked | f2c44096 |  |
| blowout-layers-90s.density_fit.low.note | fine hair holds volume with a round brush | smalki mati notur apjomu, ja tos veido ar apaļo suku | 0d8d3299 |  |
| blowout-layers-90s.density_fit.high.note | thick hair needs more layers | bieziem matiem vajag vairāk pakāpju | 310f0b0d |  |
| blowout-layers-90s.growth.note | Crown layers can expose cowlicks, so keep them longer around any whorl. | Galvvidus pakāpēs var atsegties nepakļāvīgi virpuļi, tāpēc ap jebkuru virpuli atstāj matus garākus. | d9afaccf |  |
| blowout-layers-90s.strand_note | Medium strands retain bounce; very fine strands collapse quickly. | Vidēji biezi mati saglabā elastīgu apjomu; ļoti smalki mati ātri sakrīt. | 674a9850 |  |
| blowout-layers-90s.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| blowout-layers-90s.upkeep.products.1 | volumising spray | apjoma sprejs | 050c500a |  |
| blowout-layers-90s.grow_out | Layers remain bouncy for 8-10 weeks. | Pakāpes saglabā kustīgumu un apjomu 8–10 nedēļas. | 7e39c2ab |  |
| blowout-layers-90s.client | A bouncy, layered cut that looks best after a round-brush blow-dry. | Kustīgs, pakāpenisks griezums, kas vislabāk izskatās pēc ieveidošanas ar fēnu un apaļo suku. | 1a111063 |  |
| blowout-layers-90s.stylist | Cut layers from the cheekbone to the shoulders and keep the interior connected; use a round brush to lift at the crown. Weight: weight released from the cheekbone and crown for volume, with bounce at the ends. | Griez pakāpes virzienā no vaigu kauliem līdz pleciem un saglabā iekšējo līniju vienotu; ieveidojot pacel galvvida zonu ar apaļo suku. Apjoms: smagums noņemts vaigu kaulu un galvvida zonā papildu apjomam, saglabājot matu galos kustīgumu un elastību. | 60004142 |  |
| invisible-layers-shoulder.name | Invisible-layer shoulder cut | Griezums līdz pleciem ar neredzamām kārtām | cea43ec0 |  |
| invisible-layers-shoulder.texture_fit.curly.note | cut dry and keep the interior layers long so curls stack instead of pyramid | griez sausus matus un atstāj iekšējās kārtas garas, lai lokas glīti gultos viena uz otras, nevis veidotu piramīdu | 4069bb9b |  |
| invisible-layers-shoulder.texture_fit.coily.note | the outline turns triangular without visible layers; see coily-layered-midi-stacked | bez redzamām kārtām siluets kļūst trīsstūrveida; skati coily-layered-midi-stacked | 87078a61 |  |
| invisible-layers-shoulder.density_fit.high.note | a good fit for dense hair that needs lightness without a layered look | lieliski piemērots bieziem matiem, kam vajadzīgs vieglums bez redzamām pakāpēm | aa065466 |  |
| invisible-layers-shoulder.growth.note | Do not layer too close to a crown whorl; the shorter hairs will stand up. | Neveido pakāpes pārāk tuvu galvvida virpulim – īsākie mati celsies stāvus. | b6acb383 |  |
| invisible-layers-shoulder.strand_note | Works with all strand sizes; thick, dense hair benefits most. | Piemērots jebkura biezuma matiem; vislielākais ieguvums ir bieziem un smagiem matiem. | 5e2c6308 |  |
| invisible-layers-shoulder.upkeep.products.0 | smoothing cream | nogludinošs krēms | 16bbc1bd |  |
| invisible-layers-shoulder.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| invisible-layers-shoulder.grow_out | Because the outline is blunt it grows out cleanly; trim every 10-12 weeks. | Tā kā pamatlīnija ir taisna, griezums ataug ļoti glīti; aplīdzini galus ik pēc 10–12 nedēļām. | 90315322 |  |
| invisible-layers-shoulder.client | A cut that looks one-length from the outside but moves lighter and bounces more. | Griezums, kas no ārpuses izskatās vienā garumā, taču ir vieglāks un ar elastīgāku kustību. | dd7b88ab |  |
| invisible-layers-shoulder.stylist | Take a diagonal-forward section on each side, hold the hair at a low elevation and cut long layers that finish at least 8 cm above the perimeter. Weight: a solid outline with long internal layers cut only inside the lengths. | Katrā pusē atdali šķipsnu ar diagonālu dalījumu uz priekšu, turi matus ar zemu pacēlumu un nogriez garas pakāpes, kas beidzas vismaz 8 cm virs pamatlīnijas. Apjoms: stingra ārējā līnija ar garām iekšējām pakāpēm, kas iegrieztas tikai matu iekšpusē. | 65379a0f |  |
| hush-midi.name | Korean hush cut, shoulder length | Korejiešu hush griezums līdz pleciem | da7d0803 |  |
| hush-midi.texture_fit.curly.note | cut dry on loose waves and keep the fringe longer | vieglus viļņus griez sausus un atstāj priekšmatus garākus | 4ec3e1bb |  |
| hush-midi.texture_fit.coily.note | use curly-curtain-fringe-shoulder | tā vietā izvēlies curly-curtain-fringe-shoulder | 9debebf6 |  |
| hush-midi.density_fit.low.note | fine hair looks thin without the lower weight, keep the ends blunt | smalki mati izskatās pārāk plāni bez apakšējā biezuma, tāpēc veido taisnus, blīvus galus | 6ecfb0ad |  |
| hush-midi.growth.note | Check the front hairline so the long fringe parts cleanly. | Pārbaudi priekšējo matu augšanas līniju, lai garie priekšmati dalītos glīti un dabiski. | 65188751 |  |
| hush-midi.strand_note | Fine to medium strands suit the wispy transition; coarse hair may look heavy. | Smalkiem līdz vidēji bieziem matiem vieglā pāreja piestāv vislabāk; raupji mati var izskatīties smagnēji. | 6e6c5133 |  |
| hush-midi.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| hush-midi.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| hush-midi.grow_out | The layers soften into a long layered shape without visible steps. | Pakāpes ataugot kļūst maigākas, nemanāmi saplūstot garā pakāpeniskā griezumā bez redzamām pārejām. | 4df69c1e |  |
| hush-midi.client | A soft, layered cut with light layers from the chin and a long wispy fringe that blends into the sides. It feels light and polished. | Mīksts, pakāpenisks griezums ar vieglām kārtām no zoda līnijas un gariem, gaisīgiem priekšmatiem, kas saplūst ar sāniem. Sajūta ir viegla un eleganta. | e115f6b5 |  |
| hush-midi.stylist | Cut a long, curved fringe (10-16 cm), then connect it in a soft line into face layers that start at the chin, keeping the back a single gentle curve. The crown sits 18-28 cm, so the layers show. No fringe is also a choice. A see-through fringe is its own look (see-through-fringe-shoulder). Weight: light, feathered weight with a long layered fringe that merges into side layers. | Nogriez garus, noapaļotus priekšmatus (10–16 cm), tad ar maigu pāreju savieno tos ar sejas pakāpēm, kas sākas zoda augstumā, aizmugurē saglabājot vienmērīgu, lēzenu loku. Galvvidū garums ir 18–28 cm, lai pakāpes būtu redzamas. Var izvēlēties arī variantu bez priekšmatiem. Caurspīdīgie priekšmati (see-through fringe) ir atsevišķs griezums (see-through-fringe-shoulder). Apjoms: viegls, filēts apjoms ar gariem, pakāpeniskiem priekšmatiem, kas saplūst ar sānu pakāpēm. | 6f5f48c0 |  |
| face-frame-only-shoulder.name | Face-framing shoulder cut | Seju ierāmējošs griezums līdz pleciem | 4712f642 |  |
| face-frame-only-shoulder.texture_fit.curly.note | cut dry and keep the face pieces 3 cm longer | griez sausus matus un pie sejas atstāj šķipsnas par 3 cm garākas | d32e595d |  |
| face-frame-only-shoulder.texture_fit.coily.note | see curly-face-frame-length | skatīt curly-face-frame-length | 1ce8bfd7 |  |
| face-frame-only-shoulder.growth.note | Face pieces will pull away if there is a front cowlick. | Šķipsnas pie sejas atvirzīsies uz sāniem, ja priekšpusē ir matu virpulis. | 00a98a09 |  |
| face-frame-only-shoulder.strand_note | Works with all strand sizes because only a few pieces are cut shorter. | Piemērots jebkura biezuma matiem, jo īsākas tiek nogrieztas tikai dažas šķipsnas. | 4165a112 |  |
| face-frame-only-shoulder.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| face-frame-only-shoulder.upkeep.products.1 | heat protectant | termoaizsardzības līdzeklis | f06edaab |  |
| face-frame-only-shoulder.grow_out | It grows out as a one-length cut with no rush to trim. | Tas ataug kā viena garuma griezums, un ar galu līdzināšanu var nesteigties. | fd4944f4 |  |
| face-frame-only-shoulder.client | A simple shoulder cut with a few softer pieces at the front. | Vienkāršs griezums līdz pleciem ar dažām maigākām šķipsnām priekšpusē. | 3bd25fbf |  |
| face-frame-only-shoulder.stylist | Cut a level perimeter and then cut face pieces from the cheekbone to the chin, point-cutting the edge to soften. Weight: solid one-length back with short layers only at the front. | Nogriez taisnu pamatlīniju un pēc tam izveido šķipsnas ap seju no vaigu kaula līdz zodam, galus mīkstinot ar point cut tehniku. Apjoms: aizmugurē vienots garums bez pakāpēm, īsākas pakāpes tikai priekšpusē. | 091aae05 |  |
| wavy-midi-layers.name | Wavy shoulder-length layers | Viļņainas kārtas līdz pleciem | 36636a52 |  |
| wavy-midi-layers.texture_fit.curly.note | cut dry or damp following the wave pattern | griez sausos vai mitros matos, sekojot viļņu dabiskajam kritumam | 8f46b180 |  |
| wavy-midi-layers.texture_fit.coily.note | tight curls need 6-8 cm extra length | sīkām lokām nepieciešami papildu 6–8 cm garuma | cad45edb |  |
| wavy-midi-layers.growth.note | Check cowlicks at the crown and nape since waves exaggerate them. | Pārbaudi matu virpuļus galvvidū un pie kakla, jo viļņainos matos tie kļūst vēl izteiktāki. | 5d0ef297 |  |
| wavy-midi-layers.strand_note | Fine to medium strands show the wave best. Thick hair does well with inner layers. | Smalkos un vidēji biezos matos vilnis izceļas vislabāk. Bieziem matiem lieliski palīdz iekšējās kārtas. | c7948697 |  |
| wavy-midi-layers.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| wavy-midi-layers.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| wavy-midi-layers.grow_out | It grows out gracefully without a visible step. | Ataug dabiski un glīti, bez pamanāmas pakāpju pārejas. | 40f63162 |  |
| wavy-midi-layers.client | A shoulder-length cut shaped to bring out waves, with minimal styling needed. | Griezums līdz pleciem, kas veidots viļņu izcelšanai un prasa minimālu ieveidošanu. | 9f1b6da9 |  |
| wavy-midi-layers.stylist | Cut in the wave pattern, keeping the layers long and the perimeter slightly soft. Weight: long layers that follow the wave pattern, slightly heavier at the ends. | Griez, sekojot viļņu zīmējumam, saglabājot pakāpes garas un apakšējo līniju viegli mīkstinātu. Apjoms: garas pakāpes, kas seko viļņu zīmējumam, ar nedaudz smagākiem galiem. | 09268df3 |  |
| round-layer-shoulder-curls.name | Round-layered shoulder curls | Noapaļotas kārtas cirtainiem matiem līdz pleciem | 8459cd7e |  |
| round-layer-shoulder-curls.texture_fit.wavy.note | waves need heat to hold the round shape | viļņainiem matiem nepieciešama veidošana ar fēnu, lai noturētu apaļo formu | 8a378597 |  |
| round-layer-shoulder-curls.density_fit.low.note | fine curls look thin at the ends, so layer minimally | smalkas lokas matu galos izskatās plānas, tāpēc veido minimālu pakāpeniskumu | e287822e |  |
| round-layer-shoulder-curls.growth.note | Crown whorls can push curls outward; check before choosing the crown layer length. | Virpuļi galvvidū var spiest cirtas uz āru, tāpēc pārbaudi tos pirms virsējo pakāpju garuma izvēles. | 34800a41 |  |
| round-layer-shoulder-curls.strand_note | Medium to thick curls give the cut its volume; fine curls need soft layers. | Vidējas un biezas lokas piešķir griezumam apjomu; smalkām lokām vajadzīgas maigas kārtas. | 6cb5abc7 |  |
| round-layer-shoulder-curls.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| round-layer-shoulder-curls.upkeep.products.1 | curl-defining gel | želeja cirtu izcelšanai | c3f5576c |  |
| round-layer-shoulder-curls.grow_out | The layers merge into a long curly cut without a clear step. | Pakāpes saplūst garākā cirtainā griezumā bez izteiktas pārejas līnijas. | 6e51cb50 |  |
| round-layer-shoulder-curls.client | A shoulder-length curly cut with round layers that keep volume balanced. | Cirtains griezums līdz pleciem ar noapaļotām kārtām, kas saglabā vienmērīgi sadalītu apjomu. | bc7ac40a |  |
| round-layer-shoulder-curls.stylist | Cut dry in a circular pattern, working from the crown to the perimeter, and check that the outline stays rounded. Weight: circular layering from the crown outward, with the longest curls at the perimeter. | Griez sausos matos pa apli, virzoties no galvvidus uz apakšējo līniju, un seko līdzi, lai kontūra saglabātos noapaļota. Apjoms: apļveida pakāpes no galvvidus uz āru, ar garākajām cirtām apakšējā līnijā. | 3c5156fb |  |
| curly-curtain-fringe-shoulder.name | Curly curtain-fringe shoulder cut | Cirtains griezums līdz pleciem ar aizkarveida priekšmatiem | a3e2c869 |  |
| curly-curtain-fringe-shoulder.texture_fit.wavy.note | waves need blow-drying to keep the fringe off the face | viļņainiem matiem nepieciešama veidošana ar fēnu, lai priekšmati nekristu acīs | 963d3f23 |  |
| curly-curtain-fringe-shoulder.density_fit.low.note | fine curls look thin in the fringe, so cut it fuller | smalkas lokas priekšmatos var izskatīties plānas, tāpēc tos labāk griezt biezākus | 3a54ef37 |  |
| curly-curtain-fringe-shoulder.growth.note | A front cowlick strongly affects curtain parting. | Virpulis pieres daļā būtiski ietekmē aizkarveida priekšmatu celiņu. | bf390479 |  |
| curly-curtain-fringe-shoulder.strand_note | Springy 3A-3C curls shrink most in the fringe, so tighter textures need extra length at the front. | Atsperīgas 3A–3C lokas priekšmatos saraujas visvairāk, tāpēc sīkākām lokām priekšā vajadzīgs papildu garums. | 7b824bc6 |  |
| curly-curtain-fringe-shoulder.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-curtain-fringe-shoulder.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| curly-curtain-fringe-shoulder.grow_out | The fringe grows into face-framing curls in 8-12 weeks, with no awkward stage if the sides are layered. | Priekšmati 8–12 nedēļu laikā pārtop seju ierāmējošās cirtās bez neērta pārejas posma, ja sānos ir iestrādātas pakāpes. | efb9d008 |  |
| curly-curtain-fringe-shoulder.client | Shoulder-length curls with a centre-parted fringe that frames the cheekbones and bounces. | Lokas līdz pleciem ar vidū šķirtiem priekšmatiem, kas glīti ierāmē vaigu kaulus un atsperīgi kustas. | 9e93bfe6 |  |
| curly-curtain-fringe-shoulder.stylist | Cut the fringe dry in small curl clusters, 3-4 cm longer than the final length, and refine after the curls settle. Blend the shortest pieces into the side layers rather than leaving a heavy edge. Weight: long layers with a centre-parted curly fringe at the cheekbone. | Griez priekšmatus sausos matos mazos cirtu kūlīšos, atstājot tos 3–4 cm garākus par vēlamo garumu, un pielīdzini, kad cirtas ir iegūlušās. Savieno īsākās šķipsnas ar sānu pakāpēm, nevis atstāj smagu malu. Apjoms: garas pakāpes ar vidū šķirtiem cirtainiem priekšmatiem līdz vaigu kaulam. | d6981854 |  |
| coily-blunt-ended-midi.name | Blunt-ended coily cut, jaw to collarbone | Taisns griezums sīki cirtainiem matiem, no žokļa līdz atslēgas kaulam | aa97eed3 |  |
| coily-blunt-ended-midi.texture_fit.curly.note | looser curls do not hold the even coil outline; see the Rounded curly lob | vaļīgākas lokas nesaglabā vienmērīgu kontūru; skati «Rounded curly lob» | c30536c1 |  |
| coily-blunt-ended-midi.density_fit.low.note | very fine coils look sparse at the ends, so retain density | ļoti smalkas sprodziņas galos izskatās plānas, tāpēc labāk saglabāt biezumu | f14a8c5f |  |
| coily-blunt-ended-midi.density_fit.high.note | thick coils may need slight interior thinning | biezām sprodziņām var būt vajadzīgs viegli noņemt biezumu no iekšpuses | 1de29d07 |  |
| coily-blunt-ended-midi.growth.note | Check the nape and crown for whorls that may shorten the cut. | Pārbaudi kakla un galvvidus zonu, vai tajā nav virpuļu, kas var saīsināt griezumu. | 8b27b278 |  |
| coily-blunt-ended-midi.strand_note | Coily strands retain length well when trimmed lightly. | Sīki cirtaini mati labi saglabā garumu, ja tos apgriež pavisam nedaudz. | ba923d03 |  |
| coily-blunt-ended-midi.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| coily-blunt-ended-midi.upkeep.products.1 | styling cream | ieveidošanas krēms | 01654a1c |  |
| coily-blunt-ended-midi.grow_out | Grows out gracefully since little shape is removed. | Ataug dabiski un glīti, jo matu forma tikpat kā netiek mainīta. | 19ceeba2 |  |
| coily-blunt-ended-midi.client | Natural hair with thick, even ends and minimal shaping, designed to keep length. Pulled straight it reaches the shoulders, but dry it lands between the jaw and the collarbone. | Dabiski mati ar bieziem, vienmērīgiem galiem un minimālu formu, lai saglabātu garumu. Izstiepti tie sniedzas līdz pleciem, bet sausi krīt starp žokļa līniju un atslēgas kaulu. | 52298bdb |  |
| coily-blunt-ended-midi.stylist | Trim the ends in small stretched sections, keep layers to a minimum and round the outline gently. Work on dry, detangled hair to preserve the length. Weight: even length kept at the ends, with minimal layering for length retention. | Pielīdzini galus nelielās, viegli iestieptās šķipsnās, pakāpes veido minimāli un maigi noapaļo kontūru. Strādā sausos, atšķetinātos matos, lai saglabātu garumu. Apjoms: vienmērīgs garums galos ar minimālām pakāpēm, lai maksimāli saglabātu garumu. | cdf22868 |  |
| coily-blunt-ended-midi.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| coily-layered-midi-stacked.name | Stacked coily cut, chin to collarbone | Pakāpenisks griezums sīki cirtainiem matiem, no zoda līdz atslēgas kaulam | 2ffc532d |  |
| coily-layered-midi-stacked.texture_fit.curly.note | looser curls stack less evenly; see Round-layered shoulder curls | vaļīgākas lokas kārtās negulstas tik vienmērīgi; skati «Round-layered shoulder curls» | 27b29412 |  |
| coily-layered-midi-stacked.density_fit.low.note | fine coils look thin when layered, so keep fewer layers | smalkas sprodziņas ar pakāpēm izskatās plānas, tāpēc labāk veidot mazāk pakāpju | 2449118b |  |
| coily-layered-midi-stacked.growth.note | Layers sit on whorls, so keep them longer near the crown. | Pakāpes gulstas uz virpuļiem, tāpēc galvvidus tuvumā atstāj tās garākas. | 0d6bb397 |  |
| coily-layered-midi-stacked.strand_note | Dense coils gain most from layers. Medium coils need fewer cuts. | Pakāpes vislabāk izskatās biezos, sīki cirtainos matos. Vidēja biezuma matiem vajag mazāk pakāpju. | 2cf6e68c |  |
| coily-layered-midi-stacked.upkeep.products.0 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| coily-layered-midi-stacked.upkeep.products.1 | styling cream | ieveidošanas krēms | 01654a1c |  |
| coily-layered-midi-stacked.grow_out | The layers grow out and merge into a longer shape. | Pakāpes ataugot saplūst garākā formā. | 70840666 |  |
| coily-layered-midi-stacked.client | A natural cut with layers that keep it round. Pulled straight it reaches the shoulders, but dry it lands between the chin and the collarbone. | Dabisks griezums ar pakāpēm, kas saglabā apaļu formu. Izstiepti tie sniedzas līdz pleciem, bet sausi krīt starp zodu un atslēgas kaulu. | 4f948590 |  |
| coily-layered-midi-stacked.stylist | Cut dry in sections, graduating the layers toward the crown to maintain the round shape. Weight: stacked layers that give a rounded shape and open the coil pattern. | Griez sausos matos pa šķipsnām, veidojot gradāciju virzienā uz galvvidi, lai saglabātu apaļu formu. Apjoms: pakāpeniski kārtotas pakāpes, kas piešķir apaļu formu un atver sīko cirtu zīmējumu. | 32a88266 |  |
| coily-layered-midi-stacked.images.shown_on | Shown on 4A to 4B coils | Parādīts uz 4A līdz 4B tipa sīkām cirtām | 39d89717 |  |
| curl-by-curl-dry-cut-layers.name | Soft curl layers, cut dry | Maigas pakāpes cirtainiem matiem, grieztas sausos matos | 008af7a8 |  |
| curl-by-curl-dry-cut-layers.texture_fit.straight.note | not designed for straight hair | nav paredzēts taisniem matiem | 3e23efdb |  |
| curl-by-curl-dry-cut-layers.texture_fit.wavy.note | best on 2C-3A waves if the stylist can see the wave pattern dry | vislabāk piemērots 2C–3A viļņiem, ja meistars sausos matos skaidri redz viļņu rakstu | ae6510c1 |  |
| curl-by-curl-dry-cut-layers.density_fit.low.note | fine curls need fewer and longer layers | smalkām lokām vajag mazāk pakāpju, atstājot tās garākas | ef0c2883 |  |
| curl-by-curl-dry-cut-layers.growth.note | Dry cutting shows whorls and cowlicks clearly, so the stylist can cut around them. | Griežot sausus matus, virpuļi ir skaidri redzami, tāpēc stilists var pielāgot griezumu to augšanas virzienam. | a01ccef9 |  |
| curl-by-curl-dry-cut-layers.strand_note | Each strand group is cut where it springs, so any strand size works. | Katra šķipsna tiek griezta tur, kur loka dabiski savijas, tāpēc der jebkura biezuma matiem. | 3eb7012a |  |
| curl-by-curl-dry-cut-layers.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curl-by-curl-dry-cut-layers.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| curl-by-curl-dry-cut-layers.grow_out | Grows out evenly because the cut follows the curl, so trims can be spaced at 3-4 months. | Ataug vienmērīgi, jo griezums seko katrai cirtai, tāpēc galus var pielīdzināt reizi 3–4 mēnešos. | ab50e4f7 |  |
| curl-by-curl-dry-cut-layers.client | A cut made on dry, unstyled curls so the shape suits the way your curls fall. | Griezums sausos, neieveidotos matos, lai forma precīzi atbilstu tam, kā dabiski krīt tavas lokas. | 30fbfdd0 |  |
| curl-by-curl-dry-cut-layers.stylist | Cut the hair dry and unstyled, working in small curl clusters. Shape the outline last, after the curls have been refined section by section. Weight: layer lengths follow each curl cluster, so the cut is built around the natural spring. This is the method behind DevaCut-style cuts. | Griez sausus un neieveidotus matus, strādājot ar maziem cirtu kūlīšiem. Kontūru veido pašās beigās, kad cirtas ir pielīdzinātas šķipsnu pa šķipsnai. Apjoms: pakāpju garums pielāgots katram cirtu kūlītim, veidojot griezumu ap matu dabisko atsperīgumu. Šī metode ir pamatā DevaCut stila griezumiem. | 4afa881e |  |
| sectional-even-length-curl-cut.name | Even-length rounded curls | Vienāda garuma noapaļotas lokas | aa01a8ae |  |
| sectional-even-length-curl-cut.density_fit.low.note | fine curls make the length look sparse, so keep it fuller | smalku loku dēļ mati garumā var izskatīties plāni, tāpēc labāk saglabāt biezāku formu | 1f8b8257 |  |
| sectional-even-length-curl-cut.growth.note | Cut dry or damp to see how the curl springs; check whorls and cowlicks. | Griez sausos vai mitros matos, lai redzētu, kā cirta atlec; pārbaudi matu virpuļus. | 0a1bf5c7 |  |
| sectional-even-length-curl-cut.strand_note | Dense, defined curls give the best result; the cut follows the curl pattern. | Vislabāko rezultātu dod biezas, izteiktas lokas; griezums seko loku dabiskajam rakstam. | b22e92c5 |  |
| sectional-even-length-curl-cut.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| sectional-even-length-curl-cut.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| sectional-even-length-curl-cut.grow_out | Maintains the shape for months, and grows out evenly. | Saglabā formu mēnešiem ilgi un ataug vienmērīgi. | 897de241 |  |
| sectional-even-length-curl-cut.client | A curl cut that gives an even, rounded length all around. It has few layers and little bulk. | Cirtainu matu griezums, kas veido vienmērīgu, noapaļotu līniju visapkārt. Tam ir maz pakāpju un neliels apjoms. | 1dc0d4e0 |  |
| sectional-even-length-curl-cut.stylist | Section the head into triangles or Vs, then cut each curl section to the same length from the root, checking the shape when dry. Weight: curls are cut in sections to give an even, rounded length around the head. This is the method behind Rezo-style cuts. | Sadali matus trijstūra vai V veida zonās, pēc tam katru cirtu šķipsnu nogriez vienādā garumā no saknes, pārbaudot formu sausos matos. Apjoms: cirtas griež pa zonām, lai iegūtu vienmērīgu, noapaļotu garumu visapkārt galvai. Šī metode ir pamatā Rezo stila griezumiem. | 70389882 |  |
| carved-sliced-curl-layers.name | Curl layers with bulk taken out | Pakāpenisks griezums lokām ar atvieglotu apjomu | da9fa106 |  |
| carved-sliced-curl-layers.texture_fit.wavy.note | waves can lose body if too many slices are made | viļņaini mati var zaudēt apjomu un formu, ja tos pārāk daudz izfilē | ea333dbf |  |
| carved-sliced-curl-layers.density_fit.low.note | fine curls get thin and frizzy, so use light slicing | smalkas lokas kļūst plānas un pūkojas, tāpēc jāfilē pavisam viegli | 045edbdb |  |
| carved-sliced-curl-layers.density_fit.high.note | thick curls benefit most | vispiemērotākais biezām cirtām | e94ad673 |  |
| carved-sliced-curl-layers.growth.note | Slicing near whorls makes short hairs stand up, so avoid cutting them there. | Griežot ar slīdošo tehniku (slicing) virpuļu tuvumā, īsie matiņi var celties stāvus, tāpēc tur no tā izvairies. | ef510dfd |  |
| carved-sliced-curl-layers.strand_note | Thick, dense curls profit from the slicing; fine curls get fragile. | Biezas un blīvas lokas no šādas atvieglošanas tikai iegūst, bet smalkas lokas var kļūt trauslas. | 656105e9 |  |
| carved-sliced-curl-layers.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| carved-sliced-curl-layers.upkeep.products.1 | curl-defining gel | želeja cirtu izcelšanai | c3f5576c |  |
| carved-sliced-curl-layers.grow_out | The interior grows back evenly, so trims can be 3 months apart. | Iekšējais apjoms ataug vienmērīgi, tāpēc pielīdzināt var ik pēc 3 mēnešiem. | 84e2da8f |  |
| carved-sliced-curl-layers.client | A shaped curly cut that removes bulk from the inside so curls stack neatly. | Formēts cirtainu matu griezums, kur biezums noņemts no iekšpuses, lai lokas glīti iegultu cita citā. | f64a9b74 |  |
| carved-sliced-curl-layers.stylist | Carve vertical channels in the interior with a scissor, then shape the outline by cutting curls in small sections. Weight: weight is carved out of the curl interior with vertical slices, leaving the outline round. This is the method behind Ouidad-style carving. | Ar šķērēm izgriez vertikālus kanālus matu iekšpusē, pēc tam izveido kontūru, griežot cirtas mazās šķipsnās. Apjoms: smagums no cirtu iekšpuses tiek noņemts ar vertikāliem iegriezumiem, saglabājot apaļu ārējo kontūru. Šī metode ir pamatā Ouidad stila griezumiem. | 20e4de4e |  |
| curly-hidden-undercut-midi.name | Curly hidden undercut, chin to collarbone | Slēptais undercut cirtainiem matiem, no zoda līdz atslēgas kaulam | 8851dd9d |  |
| curly-hidden-undercut-midi.texture_fit.wavy.note | waves only need it for very thick hair | viļņainiem matiem tas vajadzīgs tikai tad, ja tie ir ļoti biezi | 9f2d6042 |  |
| curly-hidden-undercut-midi.density_fit.low.note | fine curls lose density, so avoid | smalkas lokas zaudēs biezumu, tāpēc labāk izvairīties | 3adc11f4 |  |
| curly-hidden-undercut-midi.growth.note | The undercut should follow the nape whorl and hairline. | Undercut zonai jāseko kakla virpulim un matu augšanas līnijai. | 304c1992 |  |
| curly-hidden-undercut-midi.strand_note | Very thick, dense curls that stand out sideways benefit most; fine curls would look thin. | Vislielākais ieguvums ir ļoti biezām, blīvām lokām, kas plešas uz sāniem; smalkas lokas izskatītos pārāk plānas. | b2259f3a |  |
| curly-hidden-undercut-midi.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-hidden-undercut-midi.upkeep.products.1 | leave-in conditioner | nenoskalojams kondicionieris | 507f008a |  |
| curly-hidden-undercut-midi.grow_out | The undercut grows in 4-6 weeks and the cut then reads as normal layers. | Undercut ataug 4–6 nedēļās, un pēc tam griezums izskatās kā parastas pakāpes. | 16f532a7 |  |
| curly-hidden-undercut-midi.client | A curly cut that feels lighter because bulk is removed from underneath. Dry, it lands between the chin and the collarbone. From the outside it looks like normal layers. | Cirtainu matu griezums, kas šķiet vieglāks, jo biezums ir noņemts apakšā. Kad mati ir sausi, tie sniedzas no zoda līdz atslēgas kaulam. No ārpuses tas izskatās kā parasts pakāpenisks griezums. | 60456d9a |  |
| curly-hidden-undercut-midi.stylist | Clipper a shallow undercut at the nape and above the ears, 2-4 cm high, then check that the longer curls cover it. Cut the curls dry to confirm the coverage. Weight: the nape and lower sides are shortened under long curls to remove bulk. | Ar mašīnīti izveido nelielu undercut pie kakla un virs ausīm 2–4 cm augstumā, pēc tam pārbaudi, vai garākās cirtas to nosedz. Griez cirtas sausos matos, lai pārliecinātos, ka tās pilnībā nosedz apakšu. Apjoms: kakla un sānu apakšdaļa zem garajām cirtām tiek saīsināta, lai noņemtu lieko smagumu. | c507f252 |  |
| fine-curl-light-layers.name | Light layers for fine curls | Vieglas pakāpes smalkām lokām | 3377fd6b |  |
| fine-curl-light-layers.texture_fit.wavy.note | fine waves need a light cut to avoid frizz | smalkiem viļņiem vajadzīgs viegls griezums, lai tie nepūkotos | b2d66bef |  |
| fine-curl-light-layers.density_fit.medium.note | a medium density may need a few more layers | vidēji bieziem matiem var būt vajadzīgas dažas papildu pakāpes | 6fa97e7c |  |
| fine-curl-light-layers.density_fit.high.note | thick hair would be too heavy | biezi mati būs par smagu | 9381317b |  |
| fine-curl-light-layers.growth.note | Check the crown, because fine hair shows scalp at whorls. | Pārbaudi galvvidi, jo smalkiem matiem virpuļu vietās var spīdēt cauri galvas āda. | 16e1213c |  |
| fine-curl-light-layers.strand_note | Fine curls form tight rings but break easily, so a light cut keeps them thick. | Smalkas lokas veido izteiktas sprodziņas, bet viegli lūst, tāpēc viegls griezums palīdz saglabāt to biezumu. | 06d7201a |  |
| fine-curl-light-layers.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| fine-curl-light-layers.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| fine-curl-light-layers.grow_out | Grows out gracefully since little layering is used. | Ataug dabiski un glīti, jo pakāpes ir minimālas. | 64cf4dfd |  |
| fine-curl-light-layers.client | A soft curly cut that keeps your fine curls full and light, with a little shape and no heavy layering. | Maigs cirtainu matu griezums, kas saglabā tavas smalkās lokas kuplas un vieglas, piešķirot formu bez smagām pakāpēm. | 0396f1c4 |  |
| fine-curl-light-layers.stylist | Cut dry in small curl clusters, keep the perimeter dense and place only two or three long layers high at the crown to build lift. Avoid thinning shears, which break fine curl strands. Weight: minimal layers, kept long, so the fine curls stack for volume. | Griez sausos matos pa maziem cirtu kūlīšiem, saglabā blīvu apakšējo līniju un izveido tikai divas vai trīs garas pakāpes augstu galvvidū, lai paceltu apjomu no saknēm. Izvairies no filēšanas šķērēm, kas sarausta smalkās cirtas. Apjoms: minimālas un garas pakāpes, lai smalkās cirtas cita virs citas veidotu apjomu. | 628a0109 |  |
| sweeping-fringe-midi.name | Sweeping volume fringe with shoulder layers | Apjomīgi slīpie priekšmati ar pakāpēm līdz pleciem | 5786f442 |  |
| sweeping-fringe-midi.texture_fit.curly.note | cut dry and keep extra length for spring | griezt sausos matos un atstāt papildu garumu loku atlēcienam | caaa425b |  |
| sweeping-fringe-midi.texture_fit.coily.note | needs daily blow-drying; see curly-curtain-fringe-shoulder | katru dienu jāveido ar fēnu; skati «curly-curtain-fringe-shoulder» | 7326d431 |  |
| sweeping-fringe-midi.density_fit.low.note | fine hair collapses, so add root lift | smalki mati saplok, tāpēc ieteicams piešķirt apjomu pie saknēm | 18005e45 |  |
| sweeping-fringe-midi.growth.note | Crown volume exaggerates a cowlick, so check it first. | Apjoms galvvidū padara virpuli vēl izteiktāku, tāpēc vispirms to pārbaudi. | f6b0752f |  |
| sweeping-fringe-midi.strand_note | Medium strands carry the volume; fine strands need styling help. | Vidēji biezi mati labi tur apjomu; smalkiem matiem būs vajadzīga palīdzība ar ieveidošanu. | 4023fbd0 |  |
| sweeping-fringe-midi.upkeep.products.0 | blow-dry lotion | fēnošanas losjons | 31d0843a |  |
| sweeping-fringe-midi.upkeep.products.1 | root-lift spray | sakņu pacelšanas sprejs | 97d186da |  |
| sweeping-fringe-midi.grow_out | The fringe grows into long face-framing layers. | Priekšmati ataugot pārtop garās, seju ierāmējošās pakāpēs. | 0eb062b1 |  |
| sweeping-fringe-midi.client | A shoulder-length cut with big volume and a long sweeping fringe. | Griezums līdz pleciem ar pamanāmu apjomu un gariem, slīpiem priekšmatiem. | 989d3c8f |  |
| sweeping-fringe-midi.stylist | Take a wide triangle at the front hairline, cut the fringe long on a diagonal to the cheekbone, blend it into the sides and use a round brush for volume. Weight: volume at the crown, long sweeping fringe that blends into the sides. | Izdali platu trijstūri pie priekšējās matu augšanas līnijas, griez priekšmatus garus pa diagonāli līdz vaigu kaulam, sapludini ar sāniem un ieveido ar apaļo suku apjomam. Apjoms: kuplums galvvidū un gari, uz sānu pludināti priekšmati, kas saplūst ar sāniem. | 142ce526 |  |
| see-through-fringe-shoulder.name | Shoulder-length cut with a see-through fringe | Griezums līdz pleciem ar caurspīdīgiem priekšmatiem | 4c68a08f |  |
| see-through-fringe-shoulder.texture_fit.wavy.note | waves make the fringe jump, so blow it dry flat with a round brush | viļņaini mati liek priekšmatiem uzrauties, tāpēc tie jāizžāvē taisni ar apaļo suku | 85c7555f |  |
| see-through-fringe-shoulder.texture_fit.curly.note | the fringe springs up | priekšmati uzrausies uz augšu | 77aeae01 |  |
| see-through-fringe-shoulder.texture_fit.coily.note | the fringe springs up | priekšmati uzrausies uz augšu | 77aeae01 |  |
| see-through-fringe-shoulder.density_fit.low.note | if the hair is very sparse at the front, leave a few more strands | ja mati priekšpusē ir ļoti reti, atstāj nedaudz vairāk šķipsnu | 77d62d92 |  |
| see-through-fringe-shoulder.density_fit.high.note | thick hair makes the fringe dense, not see-through | biezu matu dēļ priekšmati būs blīvi, nevis caurspīdīgi | 9759fe81 |  |
| see-through-fringe-shoulder.growth.note | Needs a steady front hairline. A front cowlick lifts the fringe, which makes this a harder match. | Nepieciešama vienmērīga priekšējā matu augšanas līnija. Virpulis pie pieres ceļ priekšmatus uz augšu, tāpēc šo griezumu var būt grūtāk pielāgot. | cc521971 |  |
| see-through-fringe-shoulder.strand_note | Fine to medium straight strands give the see-through finish. Thick, coarse strands make the fringe dense. | Smalki līdz vidēji biezi, taisni mati rada caurspīdīgu efektu. Biezi un raupji mati priekšmatus padara blīvus. | 311d6801 |  |
| see-through-fringe-shoulder.upkeep.products.0 | dry shampoo | sausais šampūns | 0aaae6ea |  |
| see-through-fringe-shoulder.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| see-through-fringe-shoulder.grow_out | The fringe grows into curtain pieces, then into face-framing layers. | Priekšmati ataugot pārtop aizkarveida šķipsnās un pēc tam seju ierāmējošās pakāpēs. | 3366018d |  |
| see-through-fringe-shoulder.client | A shoulder-length cut with very light layers and a thin veil of fringe across the brow. You can see through it. | Griezums līdz pleciem ar pavisam vieglām pakāpēm un plīvuram līdzīgiem, plāniem priekšmatiem pār pieri. Tiem var redzēt cauri. | fc21b02a |  |
| see-through-fringe-shoulder.stylist | Cut a narrow fringe of 5-9 cm, two or three strands deep, tapered and not blunt, and blend it into the sides. Keep the layers very light. Check the front hairline and any cowlick before cutting. From behind it looks close to a one-length shoulder cut. Weight: a thin, see-through fringe over a shoulder cut with very light layers. | Izdali šauru 5–9 cm priekšmatu zonu 2–3 šķipsnu biezumā, griez galus pludinātus, nevis taisnus, un sapludini ar sāniem. Pakāpes saglabā ļoti vieglas. Pirms griešanas pārbaudi priekšējo matu augšanas līniju un virpuļus. No aizmugures griezums izskatās gandrīz kā vienāda garuma griezums līdz pleciem. Apjoms: plāni, caurspīdīgi priekšmati un griezums līdz pleciem ar ļoti vieglām pakāpēm. | c02d8b59 |  |
| full-fringe-shoulder.name | Shoulder-length cut with a full fringe | Griezums līdz pleciem ar bieziem priekšmatiem | f190d6d6 |  |
| full-fringe-shoulder.texture_fit.wavy.note | needs a blow-dry to lie flat | jāizžāvē ar fēnu, lai tie kristu taisni | e3600266 |  |
| full-fringe-shoulder.texture_fit.curly.note | the fringe springs up and the ends do not turn in | priekšmati uzrausies uz augšu un galiņi nelieksies uz iekšu | fbfe5c69 |  |
| full-fringe-shoulder.texture_fit.coily.note | the fringe springs up and the ends do not turn in | priekšmati uzrausies uz augšu un galiņi nelieksies uz iekšu | fbfe5c69 |  |
| full-fringe-shoulder.density_fit.low.note | the fringe takes hair from the front, so fine hair can look thin behind it | priekšmati paņem matus no priekšpuses, tāpēc smalki mati aiz tiem var izskatīties paplāni | e08f26d7 |  |
| full-fringe-shoulder.density_fit.high.note | thin the fringe lightly so it is not heavy | Viegli iefilē priekšmatus, lai tie nebūtu smagi | f9d5099a |  |
| full-fringe-shoulder.growth.note | A front cowlick pushes a full fringe apart, which makes this a harder match. | Virpulis pie pieres sadala biezo priekšmatu līniju, tāpēc šāds griezums var būt mazāk piemērots. | d9c2eff4 |  |
| full-fringe-shoulder.strand_note | Straight, medium strands hold the blunt fringe. Very fine or very curly strands do not. | Taisni, vidēji biezi mati labi tur taisno priekšmatu līniju. Ļoti smalkiem vai ļoti cirtainiem matiem tā neturēsies. | 23e71689 |  |
| full-fringe-shoulder.upkeep.products.0 | smoothing serum | nogludinošs serums | 7074d46d |  |
| full-fringe-shoulder.upkeep.products.1 | dry shampoo | sausais šampūns | 0aaae6ea |  |
| full-fringe-shoulder.grow_out | The fringe grows past the brow in 6 to 8 weeks and can be swept to the side. | Priekšmati ataug pāri uzacīm 6 līdz 8 nedēļās, un tos var ērti nēsāt uz sānu. | 364df27c |  |
| full-fringe-shoulder.client | A shoulder-length cut in nearly one length with a full, blunt fringe to the brow. The ends turn slightly in. | Gandrīz vienāda garuma griezums līdz pleciem ar bieziem, taisniem priekšmatiem līdz uzacīm. Matu gali viegli liecas uz iekšu. | f9857701 |  |
| full-fringe-shoulder.stylist | Cut a full blunt fringe of 6-9 cm, taken from the crown, and keep the rest nearly one length with only light layers. Turn the ends in slightly with a blow-dry. Check the front hairline and any cowlick first. Weight: a heavy blunt fringe over a near one-length shoulder cut. | Nogriez biezus, taisnus 6–9 cm priekšmatus no galvvidus, bet pārējos matus atstāj gandrīz vienā garumā ar vieglām pakāpēm. Fēnojot matu galus viegli ieloki uz iekšu. Vispirms pārbaudi priekšējo matu augšanas līniju un virpuļus. Apjoms: biezi, taisni priekšmati un griezums līdz pleciem gandrīz bez pakāpēm. | 078aad8e |  |
| slick-back-classic.name | Classic slick back | Klasiskais slick back | 48ae21c2 |  |
| slick-back-classic.fade.note | Scissor or clipper taper that stays at or above #2; no hard fade. | Pāreja ar šķērēm vai mašīnīti vismaz #2 garumā; bez krasa fade. | f5ec9423 |  |
| slick-back-classic.sideburns | Mid-length | Vidēji garas | f153d712 |  |
| slick-back-classic.texture_fit.wavy.note | Blow-dry back first. | Vispirms izfēno uz aizmuguri. | a4b4c47a |  |
| slick-back-classic.texture_fit.curly.note | Use gel or cream; hair may need smoothing. | Lieto želeju vai krēmu; matus var nākties nogludināt. | 0ee37d44 |  |
| slick-back-classic.texture_fit.coily.note | Better as a brush-back or wave look. | Labāk izskatīsies atglausts vai veidots viļņos. | 7d025581 |  |
| slick-back-classic.density_fit.low.note | Use a matte product and a brush rather than a fine comb so the scalp shows less. | Izvēlies matētu produktu un suku, nevis smalku ķemmi, lai galvas āda mazāk spīdētu cauri. | f3d88507 |  |
| slick-back-classic.growth.whorl_note | Crown thinning shows on the comb lines. | Matu izretināšanās galvvidū būs pamanāma ķemmes līnijās. | e9a32a54 |  |
| slick-back-classic.growth.note | Pulls all hair off the forehead and shows the whole hairline; not recommended past stage 2. | Atglauž visus matus no pieres un pilnībā atsedz matu augšanas līniju; nav ieteicams pēc 2. stadijas. | 6192e98a |  |
| slick-back-classic.density_note | Medium to thick; fine hair shows scalp lines between comb tracks, so use less shine and more matte hold. | Vidējiem līdz bieziem matiem; smalkos matos starp ķemmes līnijām spīd cauri galvas āda, tāpēc izvēlies mazāk spīduma un matētāku fiksāciju. | 4b1a7769 |  |
| slick-back-classic.glasses_note | Works with almost any frames. | Piemērots gandrīz jebkuriem briļļu rāmjiem. | 03e43e2a |  |
| slick-back-classic.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| slick-back-classic.upkeep.products.1 | gel | želeja | cdc00f6c |  |
| slick-back-classic.grow_out | Keep the length and drop the taper: it flows into a medium brushed-back look in about 8 weeks. | Saglabā garumu un ļauj taper pārejai ataugt: apmēram 8 nedēļu laikā tas pārtop vidēja garuma atglaustā griezumā. | da0ad51f |  |
| slick-back-classic.client | All the hair combed straight back with a polished finish. Needs a daily product and comb. | Visi mati atglausti taisni atpakaļ, radot gludu, koptu izskatu. Ikdienā būs vajadzīgs ieveidošanas līdzeklis un ķemme. | d5141dc7 |  |
| slick-back-classic.stylist | Leave 8-10 cm on top, taper the sides cleanly and blend to the nape. Check the hair direction at the temples. | Augšpusē atstāj 8–10 cm, sānos izveido tīru taper pāreju un sapludini to ar kakla līniju. Pārbaudi matu augšanas virzienu pie deniņiem. | 2edd1149 |  |
| slick-back-undercut.name | Slick back with disconnected sides | Slick back ar atdalītiem sāniem | 2889ebec |  |
| slick-back-undercut.fade.note | Mid fade or disconnected #2. | Mid fade vai atdalīts #2 garums. | f988b2e8 |  |
| slick-back-undercut.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| slick-back-undercut.texture_fit.curly.note | Use a smoothing balm and blow-dry. | Ieklāj nogludinošu balzamu un izžāvē ar fēnu. | 7170f482 |  |
| slick-back-undercut.texture_fit.coily.note | Choose a different style. | Izvēlies citu griezumu. | 7b20ae09 |  |
| slick-back-undercut.density_fit.low.note | Use a matte product and a brush rather than a fine comb so the scalp shows less. | Izvēlies matētu produktu un suku, nevis smalku ķemmi, lai galvas āda mazāk spīdētu cauri. | f3d88507 |  |
| slick-back-undercut.growth.note | Fully exposes the hairline; best with full hairline. | Pilnībā atsedz matu augšanas līniju; vislabāk piemērots, ja tā ir bieza. | f062534e |  |
| slick-back-undercut.density_note | Medium to thick; thin hair shows comb tracks and loses the sleek effect. | Vidējiem līdz bieziem matiem; plānos matos ir redzamas ķemmes līnijas un zūd gludais efekts. | 4e506b62 |  |
| slick-back-undercut.glasses_note | Fine with most frames; the open temples let thicker frames dominate. | Piemērots lielākajai daļai rāmju; atsegtie deniņi ļauj dominēt masīvākiem rāmjiem. | 90f9782a |  |
| slick-back-undercut.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| slick-back-undercut.grow_out | Fade grows into a taper in 4 weeks. | Fade 4 nedēļu laikā ataug par taper pāreju. | dacd79d6 |  |
| slick-back-undercut.client | Faded sides with a long top combed straight back. Sharp contrast and a smooth, sleek finish. | Sāni ar fade pāreju un gari augšējie mati, kas atglausti taisni atpakaļ. Izteikts kontrasts un gluds, elegants koptēls. | 9d24ef11 |  |
| slick-back-undercut.stylist | Fade to #1 at the temple, leave 8-10 cm on top and cut a long graduated layer to the crown. Test the comb-through and thin the back if it bulks. | Pie deniņiem veido fade līdz #1, augšpusē atstāj 8–10 cm un griez garu graduētu pakāpi virzienā uz galvvidi. Pārbaudi, kā mati ķemmējas atpakaļ, un pafilē aizmuguri, ja tā ir par smagu. | 160c993c |  |
| side-part-classic.name | Classic side part | Klasiskais sānu celiņš | 7b6e22a9 |  |
| side-part-classic.fade.note | Scissor or clipper taper over the ears and neck. | Taper pāreja ar šķērēm vai mašīnīti ap ausīm un kakla līnijā. | da1611eb |  |
| side-part-classic.sideburns | Mid-ear, tapered | Līdz auss vidum, ar pāreju | cbef7b0d |  |
| side-part-classic.texture_fit.curly.note | Dry-cut and use cream. | Griez sausos matos un ieveido ar krēmu. | b6e71dd9 |  |
| side-part-classic.texture_fit.coily.note | Keep it at 3-4 cm with a comb part. | Saglabā 3–4 cm garumu un ieveido celiņu ar ķemmi. | e84591c0 |  |
| side-part-classic.growth.whorl_note | Place the part where the crown whorl falls naturally. | Veido celiņu tur, kur dabiski iegulst galvvidus virpulis. | 02f20249 |  |
| side-part-classic.growth.note | A side part conceals mild recession; avoid pulling the part across a stage 4 front. | Sānu celiņš palīdz piesegt nelielas atkāpes pie deniņiem; izvairies vilkt celiņu pāri priekšpusei, ja atkāpes sasniegušas 4. stadiju. | 5c989123 |  |
| side-part-classic.density_note | Any; thin hair benefits from a part on the natural side. | Jebkuram biezumam; plāniem matiem piemērotāks būs celiņš to dabiskā krituma pusē. | d9604b7c |  |
| side-part-classic.glasses_note | Fits all frames. | Piemērots visiem briļļu rāmjiem. | 0b9ce25c |  |
| side-part-classic.upkeep.products.0 | light pomade | vieglas fiksācijas pomāde | ccc6c968 |  |
| side-part-classic.upkeep.products.1 | gel | želeja | cdc00f6c |  |
| side-part-classic.grow_out | Grows to a longer side part. | Ataugot pārtop garākā griezumā ar sānu celiņu. | 3a92aae3 |  |
| side-part-classic.client | A neat parted cut with short, tidy sides. Easy, traditional and looks fine in a suit. | Kārtīgs griezums ar celiņu un īsiem, sakoptiem sāniem. Vienkāršs, tradicionāls un lieliski izskatās pie uzvalka. | 5227971c |  |
| side-part-classic.stylist | Find the natural part with a comb; cut the sides with scissor-over-comb and a taper. Leave about 6 cm on top. | Ar ķemmi atrodi dabisko celiņu; sānus nogriez ar šķērēm pār ķemmi un izveido taper pāreju. Augšpusē atstāj apmēram 6 cm. | de61d802 |  |
| hard-part-fade.name | Hard part with fade | Hard part ar fade | 6cabd5e4 |  |
| hard-part-fade.fade.note | Mid skin fade; razor-line the part. | Mid skin fade; celiņa līnija iezīmēta ar bārdasnazi. | 87e4f9d5 |  |
| hard-part-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| hard-part-fade.texture_fit.curly.note | Press with a brush; use gel. | Nogludini ar suku; lieto želeju. | e55fb8a2 |  |
| hard-part-fade.texture_fit.coily.note | Part works only on short, relaxed or wave-brushed hair. | Celiņš derēs tikai īsos, ķīmiski taisnotos vai viļņos ieveidotos matos. | e37a187a |  |
| hard-part-fade.growth.note | The hard part shows a stage 3 hairline; avoid beyond. | Hard part celiņš atsedz 3. stadijas matu augšanas līniju; pie izteiktākas matu atkāpšanās no tā labāk izvairīties. | 0df5aa99 |  |
| hard-part-fade.density_note | Any density; fine hair needs a light product so the part line stays visible. | Piemērots jebkuram matu biezumam; smalkiem matiem vajadzīgs viegls līdzeklis, lai celiņa līnija paliktu redzama. | fa5866bc |  |
| hard-part-fade.glasses_note | Compatible with most frames; the part sits above the frame line. | Piemērots lielākajai daļai rāmju; celiņš atrodas virs rāmja augšējās līnijas. | cb6298c5 |  |
| hard-part-fade.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| hard-part-fade.upkeep.products.1 | gel | želeja | cdc00f6c |  |
| hard-part-fade.grow_out | Fade needs weekly lines; part loses shape in 3 weeks. | Fade kontūras jāatjauno katru nedēļu; celiņš zaudē formu 3 nedēļās. | 89ecf326 |  |
| hard-part-fade.client | A fade with a visible shaved line where the hair parts. Sharp and tidy. | Fade griezums ar pamanāmu, izskūtu celiņa līniju. Izteiksmīgs un kārtīgs. | 4053524c |  |
| hard-part-fade.stylist | Comb the part where the hair naturally breaks, trim the line with a T-blade or foil and soften the edges with a brush. Re-line it every visit. | Ieķemmē celiņu vietā, kur mati dabiski pašķiras, iezīmē līniju ar T-veida asmeni vai šeiveri un ar birstīti mīkstini malas. Atjauno līniju katrā apmeklējumā. | abd138bb |  |
| comb-over-fade.name | Comb over with fade | Comb over ar fade | c2271c0f |  |
| comb-over-fade.fade.note | Low or mid skin fade. | Low vai mid skin fade. | db3bb9dd |  |
| comb-over-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| comb-over-fade.texture_fit.curly.note | Blow-dry and cream. | Izžāvē ar fēnu un lieto krēmu. | 2d5b7372 |  |
| comb-over-fade.texture_fit.coily.note | Choose a taper with twists instead. | Tā vietā labāk izvēlies taper ar twists sprodziņām. | 82cd4c61 |  |
| comb-over-fade.density_fit.low.note | Keep the sweep light and short; never comb long hair across a sparse area. | Pārlikumu veido vieglu un īsu; nekad neķemmē garus matus pāri retākām vietām. | f247fafe |  |
| comb-over-fade.growth.note | Hair swept sideways lets stage 3 recession look fuller; avoid pulling hair across a bald area. | Uz sānu pārķemmēti mati liek 3. stadijas matu atkāpēm izskatīties biezākām; izvairies ķemmēt matus pāri kailajām vietām. | 26c86aa0 |  |
| comb-over-fade.density_note | Medium to thick; the sweep needs coverage. | Vidējiem līdz bieziem matiem; pārķemmētajai daļai vajadzīgs labs biezums. | 3f1a9ebe |  |
| comb-over-fade.glasses_note | Fine with most frames. | Labi izskatās ar lielāko daļu rāmju. | abb9caf2 |  |
| comb-over-fade.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| comb-over-fade.upkeep.products.1 | texturing spray | tekstūras sprejs | bf72ef9a |  |
| comb-over-fade.grow_out | Fade grows in about 4 weeks; the sweep carries on as a side part. | Fade ataug apmēram 4 nedēļās; pārķemmētā augšdaļa pārtop par griezumu ar sānu celiņu. | e56bd82a |  |
| comb-over-fade.client | Short faded sides with hair swept to the side. A smart, modern take on the classic comb-over. | Īsi sāni ar fade pāreju un uz sānu pārlikti mati. Gaumīgs un mūsdienīgs klasiskā comb-over griezuma variants. | ef0fe853 |  |
| comb-over-fade.stylist | Cut a distinct guide line and graduate the top toward the part. Keep the sweep light so no gap is left at the front; avoid pulling long hair across a bald area. | Izveido skaidru kontrollīniju un graduē augšpusi virzienā uz celiņu. Saglabā pārķemmēto daļu vieglu, lai priekšpusē neveidotos tukšas vietas; izvairies no garu matu vilkšanas pāri kailajām vietām. | 98938836 |  |
| brush-back-natural.name | Natural brush back | Dabisks brush back | e942aa44 |  |
| brush-back-natural.fade.note | Soft taper only. | Tikai maiga taper pāreja. | 3fa3a3ff |  |
| brush-back-natural.sideburns | Mid-length | Vidēji garas | f153d712 |  |
| brush-back-natural.texture_fit.wavy.note | Natural wave helps. | Dabiskais matu vilnis palīdz. | 23011a29 |  |
| brush-back-natural.texture_fit.curly.note | Brush back with cream. | Atglaud atpakaļ ar krēmu. | e28e2030 |  |
| brush-back-natural.texture_fit.coily.note | Use a pick. | Lieto afro ķemmi. | f73b930e |  |
| brush-back-natural.density_fit.low.note | Use a volumising spray and keep the top shorter. | Lieto apjoma spreju un atstāj augšējos matus īsākus. | d05fccfb |  |
| brush-back-natural.growth.note | Brushed back shows the hairline; ok at stage 2-3. | Atglausti mati atsedz matu augšanas līniju; piemērots 2.–3. stadijā. | 9e498e79 |  |
| brush-back-natural.density_note | Needs medium density; very fine hair needs a volumising spray. | Nepieciešams vidējs matu biezums; ļoti smalkiem matiem vajadzēs apjoma spreju. | 54727cf3 |  |
| brush-back-natural.glasses_note | Good with most frames. | Labi izskatās ar lielāko daļu rāmju. | 6c7b9109 |  |
| brush-back-natural.upkeep.products.0 | light cream | viegls krēms | d9b92bf2 |  |
| brush-back-natural.upkeep.products.1 | paste | matu pasta | a2c183d5 |  |
| brush-back-natural.grow_out | Just grow: it moves into a long flow in about 3 months. | Vienkārši audzē: apmēram 3 mēnešu laikā tas pārtop garākā, brīvi krītošā flow griezumā. | 5b21e1dd |  |
| brush-back-natural.client | A relaxed swept-back look without shine; hair sits back naturally with a light product. | Brīvs, atpakaļ atglausts sakārtojums bez spīduma; ar vieglu līdzekli mati dabiski gulstas atpakaļ. | 4e83a5c0 |  |
| brush-back-natural.stylist | Cut the top longer than the sides, layer toward the crown and blow-dry back. A gentle taper keeps the shape without a hard line. | Nogriez augšpusi garāku par sāniem, veido pakāpes virzienā uz galvvidi un izfēno uz aizmuguri. Maiga taper pāreja saglabā formu bez asas līnijas. | 1eea8bb9 |  |
| curly-side-part.name | Curly side part | Cirtains side part | 7bc5c7f8 |  |
| curly-side-part.fade.note | Low fade. | Low fade. | d3746528 | same |
| curly-side-part.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| curly-side-part.texture_fit.straight.note | Not suited: use a classic side part. | Nav piemērots: izvēlies klasisko side part. | f7b45134 |  |
| curly-side-part.texture_fit.wavy.note | Works with a short side part and a curl cream. | Labi izskatās ar īsu celiņu un loku krēmu. | 45163ec7 |  |
| curly-side-part.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-side-part.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-side-part.density_fit.low.note | Keep the curls compact; a hard part shows more scalp on low density. | Saglabā lokas kompaktas; izskūts celiņš retos matos vairāk atsedz galvas ādu. | d817307e |  |
| curly-side-part.growth.note | Hard part reveals the hairline. | Izskūts celiņš atsedz matu augšanas līniju. | f56bd35f |  |
| curly-side-part.density_note | Medium to thick. | Vidēji līdz biezi mati. | 48953dec |  |
| curly-side-part.glasses_note | Sits well with most frames; keep hair above the ear short so the arms rest cleanly. | Labi sader ar lielāko daļu rāmju; virs ausīm matus atstāj īsus, lai briļļu kājiņas ērti piegultu. | 267e7433 |  |
| curly-side-part.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-side-part.grow_out | Stop the fade; the part grows into a curly flow in about 3 months. | Pārtrauc atjaunot fade; celiņš apmēram 3 mēnešu laikā pāraug cirtainā flow griezumā. | c86badb7 |  |
| curly-side-part.client | Curls swept to one side with a razor part. Smart, easy and suitable for work. | Uz vienu sānu ieveidotas lokas ar bārdasnazi iezīmētu celiņu. Elegants, ērts un darbam piemērots griezums. | a01f348b |  |
| curly-side-part.stylist | Part at the natural line, cut dry in curl clumps, fade low and soften the edges. | Iešķir celiņu pa dabisko līniju, griez sausus matus pa cirtu šķipsnām, veido zemu fade un mīkstini pārejas malas. | 97030a56 |  |
| sponge-twists-taper.name | Sponge twists with taper | Sponge twists ar taper | 6126f831 |  |
| sponge-twists-taper.fade.note | Low or mid taper; top sponged into tight coils. | Low vai mid taper; augšdaļa ar sūkli ieveidota ciešās sprodziņās. | da0803ab |  |
| sponge-twists-taper.sideburns | Tapered, lined | Ar taper pāreju, precīzi iezīmētas | 6c4e1f86 |  |
| sponge-twists-taper.texture_fit.straight.note | Straight hair will not form coils. | Taisni mati neveidos sprodziņas. | 3a1c51a8 |  |
| sponge-twists-taper.texture_fit.wavy.note | Waves do not hold twist. | Viļņaini mati netur twistus. | a203c549 |  |
| sponge-twists-taper.texture_fit.curly.note | Loose curls of 4+ cm can coil with a sponge and cream. | Vaļīgas cirtas no 4+ cm garuma var ieveidot spirālēs ar sūkli un krēmu. | 82ba92b8 |  |
| sponge-twists-taper.texture_fit.coily.note | Core design; needs 3+ cm of hair. | Pamatdizains; nepieciešami vismaz 3 cm gari mati. | 0db3c0bb |  |
| sponge-twists-taper.density_fit.low.note | The coils will be smaller; keep the top at the shorter end. | Spirāles būs smalkākas; virspusē matus labāk atstāt īsākus. | 33f77d74 |  |
| sponge-twists-taper.growth.whorl_note | Dense coils cover a thin crown. | Blīvas sīkās cirtas labi nosedz retāku virspauri. | 2097091e |  |
| sponge-twists-taper.growth.note | Coils add visual volume that covers stage 3-4. | Sīkās cirtas piešķir vizuālu apjomu, kas nosedz 3.–4. stadiju. | 9b10fd44 |  |
| sponge-twists-taper.density_note | Medium to thick; very fine hair makes weak coils. | Vidēji līdz biezi mati; ļoti smalki mati veido vājas cirtas. | f2bf0f86 |  |
| sponge-twists-taper.glasses_note | Fine; the taper stays below the arm. | Viss kārtībā; taper pāreja paliek zem briļļu kājiņas. | df34acd4 |  |
| sponge-twists-taper.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| sponge-twists-taper.upkeep.products.1 | twist sponge | tvistu sūklis | d4587ed7 |  |
| sponge-twists-taper.grow_out | Stop sponging and the coils loosen into a short afro in about 4 weeks. | Pārtrauc veidot tvistus ar sūkli, un cirtas apmēram 4 nedēļu laikā atraisās par īsu afro. | d5372ec5 |  |
| sponge-twists-taper.client | Short coils across the top, spiral-formed with a small sponge. Quick to refresh. | Īsas spirāles matu virspusē, kas veidotas ar nelielu sūkli. Ātri atsvaidzināms griezums. | 3e27c65a |  |
| sponge-twists-taper.stylist | Hydrate, apply cream, rub the sponge in small circles in one direction. Keep the taper clean. | Mitrini matus, ieklāj krēmu un ar sūkli veic nelielas apļveida kustības vienā virzienā. Saglabā taper pāreju tīru. | b250ae45 |  |
| finger-coils-taper.name | Finger coils with taper | Finger coils ar taper | 05fee948 |  |
| finger-coils-taper.fade.note | Taper; defined top. | Taper pāreja; izteiksmīga virspuse. | 75bbe4e2 |  |
| finger-coils-taper.sideburns | Tapered | Ar taper pāreju | dcbacddd |  |
| finger-coils-taper.texture_fit.straight.note | Not suited: use a textured crop. | Nav piemērots: izvēlies textured crop. | 09998d95 |  |
| finger-coils-taper.texture_fit.wavy.note | Not suited: waves do not hold coils. | Nav piemērots: viļņaini mati netur spirāles. | f0c338ea |  |
| finger-coils-taper.texture_fit.curly.note | Loose curls need gel to coil. | Vaļīgām cirtām vajadzīga želeja, lai ieveidotu spirāles. | 5768501e |  |
| finger-coils-taper.texture_fit.coily.note | Core design; needs 5+ cm. | Pamatdizains; nepieciešami vismaz 5 cm gari mati. | 6ec3d7c6 |  |
| finger-coils-taper.density_fit.low.note | Gaps show between coils; keep the top shorter. | Starp spirālēm būs redzama galvas āda; virspusi labāk atstāt īsāku. | eadb19c8 |  |
| finger-coils-taper.growth.note | Coils cover temples at stage 3-4. | Sīkās cirtas nosedz deniņus 3.–4. stadijā. | e504dde0 |  |
| finger-coils-taper.density_note | Medium to thick; very fine strands are too slippery to hold a coil. | Vidēji līdz biezi mati; ļoti smalki mati ir pārāk slideni, lai noturētu cirtu. | c2c22a6a |  |
| finger-coils-taper.glasses_note | Sits well with most frames; keep hair above the ear short so the arms rest cleanly. | Labi sader ar lielāko daļu rāmju; virs ausīm matus atstāj īsus, lai briļļu kājiņas ērti piegultu. | 267e7433 |  |
| finger-coils-taper.upkeep.products.0 | twisting cream | tvistu krēms | 647b9981 |  |
| finger-coils-taper.upkeep.products.1 | gel | želeja | cdc00f6c |  |
| finger-coils-taper.grow_out | Releases to a short afro in about 2-3 weeks; re-form every week or two. | Apmēram 2–3 nedēļu laikā atraisās par īsu afro; atjauno formu ik pēc 1–2 nedēļām. | 95c69230 |  |
| finger-coils-taper.client | Hand-formed coils on top with neat sides. Looks planned and full of texture. | Ar pirkstiem veidotas spirāles virspusē un glīti sāni. Pārdomāts un izteikti teksturēts tēls. | 2666cb98 |  |
| finger-coils-taper.stylist | Moisturise, section the top and wrap each curl around a finger with gel or twisting cream; let it set before releasing. | Mitrini matus, sadali augšējo daļu šķipsnās un ar želeju vai tvistu krēmu aptin katru cirtu ap pirkstu; pirms atlaišanas ļauj tai nofiksēties. | 00eaea09 |  |
| short-twists-fade.name | Short twists with fade | Īsi twists ar fade | 2840d54d |  |
| short-twists-fade.fade.note | Low or temple fade under the twists. | Zems fade vai temple fade zem twistiem. | 2ecdef9a |  |
| short-twists-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| short-twists-fade.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| short-twists-fade.texture_fit.wavy.note | Not suited: waves do not hold twists. | Nav piemērots: viļņaini mati netur twistus. | 89938ee0 |  |
| short-twists-fade.texture_fit.curly.note | Loose curls hold twists poorly. | Vaļīgās cirtās twisti turas slikti. | 48f22e52 |  |
| short-twists-fade.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| short-twists-fade.density_fit.low.note | Twist larger sections and keep the edges loose. | Veido twistus no lielākām šķipsnām un atstāj brīvākas malas. | a24d6cf6 |  |
| short-twists-fade.growth.note | Avoid tight twists at thin temples (traction). | Izvairies no ciešiem tvistiem pie retākiem deniņiem (lai neradītu lieku iestiepumu). | aa44d3e6 |  |
| short-twists-fade.density_note | Medium to thick; fine hair needs a rope-style twist to hold. | Vidēji līdz biezi mati; smalkiem matiem nepieciešams tvists virvītes tehnikā, lai tas turētos. | f45f2f38 |  |
| short-twists-fade.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| short-twists-fade.upkeep.products.0 | twisting butter | tvistu sviests | c2b8c1c7 |  |
| short-twists-fade.upkeep.products.1 | oil | eļļa | ab7902bc |  |
| short-twists-fade.grow_out | Twists loosen into a twist-out in about 2 weeks; they can be re-twisted every 1-2 weeks. | Tvisti apmēram 2 nedēļu laikā atraisās par twist-out; tos var pārvīt ik pēc 1–2 nedēļām. | 9e3dfc23 |  |
| short-twists-fade.client | Short twists on top with faded sides. Defined and neat; easy to maintain. | Īsi twisti virspusē un sāni ar fade pāreju. Izteiksmīgs, glīts un viegli uzturams griezums. | 685348db |  |
| short-twists-fade.stylist | Section and twist with butter or cream, leave the edges looser to protect the hairline and fade the sides low. | Sadali matus šķipsnās un savij ar sviestu vai krēmu, pie matu augšanas līnijas atstāj brīvāk, lai to pasargātu, un sānos veido zemu fade. | 404d6b0b |  |
| long-two-strand-twists.name | Long two-strand twists | Long two-strand twists | f6fbbf4e | same |
| long-two-strand-twists.sideburns | Natural | Dabiskas | d6acb6d5 |  |
| long-two-strand-twists.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| long-two-strand-twists.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| long-two-strand-twists.texture_fit.curly.note | Works with defined curls and twisting cream; twists will be looser. | Piemērots izteiktām cirtām, izmantojot twistu krēmu; twisti būs vaļīgāki. | 06e7aef5 |  |
| long-two-strand-twists.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| long-two-strand-twists.density_fit.low.note | Twist larger sections with soft edges; the parts will show. | Veido twistus no lielākām šķipsnām ar maigākām malām; būs redzams matu dalījums. | 1c334ca1 |  |
| long-two-strand-twists.growth.note | Tight at the edges can cause traction; keep edges soft. | Pārāk ciešs pinums pie matu augšanas līnijas var radīt iestiepumu; veido malas brīvākas. | 24cd7ea0 |  |
| long-two-strand-twists.density_note | Medium to thick; very fine hair may unravel. | Vidēji līdz biezi mati; ļoti smalki mati var atvīties. | 3de72427 |  |
| long-two-strand-twists.glasses_note | Hair may curl or drop over the arms of glasses; trim a clean channel behind the ear if frames sit on top of the hair. | Mati var lokoties vai krist pāri briļļu kājiņām; aiz ausīm izveido tīru līniju, ja rāmis balstās uz matiem. | b7f64717 |  |
| long-two-strand-twists.upkeep.products.0 | twisting butter | tvistu sviests | c2b8c1c7 |  |
| long-two-strand-twists.grow_out | Twists last 2-4 weeks and grow into longer locs if left. | Tvisti turas 2–4 nedēļas un, ja tos neizjauc, laika gaitā pārtop garākos loksos. | efcbcf44 |  |
| long-two-strand-twists.client | Twists past ear length, loose or defined. Protects the hair, stays tidy and styles many ways. | Twisti garumā zem ausīm — brīvi vai izteikti definēti. Pasargā matus, ilgi saglabājas kopti un piedāvā daudzveidīgas veidošanas iespējas. | 40e253ed |  |
| long-two-strand-twists.stylist | Section evenly, twist with butter or cream and keep the edges soft to protect the hairline. | Vienmērīgi sadali matus šķipsnās, savij ar sviestu vai krēmu un saglabā matu augšanas līniju brīvāku, lai pasargātu matus. | fd18ddb1 |  |
| starter-locs-fade.name | Starter locs with fade | Starter locs ar fade | b8fbaace |  |
| starter-locs-fade.fade.note | Low or mid fade. | Zems vai vidējs fade. | f1086c1e |  |
| starter-locs-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| starter-locs-fade.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| starter-locs-fade.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| starter-locs-fade.texture_fit.curly.note | Works with curl-coils; a loctician decides. | Piemērots, ja cirtas veido spirāles; piemērotību izvērtē locs meistars. | b422f112 |  |
| starter-locs-fade.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| starter-locs-fade.density_fit.low.note | Start fewer, larger locs; ask a loctician about the size. | Sāc ar mazāku skaitu un biezākiem locs; par izmēru konsultējies ar locs meistaru. | 18f57856 |  |
| starter-locs-fade.growth.note | Tight installs at thin temples can cause traction. | Pārāk cieša veidošana pie retākiem deniņiem var radīt matu iestiepumu. | daa25a2b |  |
| starter-locs-fade.density_note | Medium to thick; very fine hair may unravel. | Vidēji līdz biezi mati; ļoti smalki mati var atvīties. | 3de72427 |  |
| starter-locs-fade.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| starter-locs-fade.upkeep.products.0 | loc gel | loksu želeja | 22087c9a |  |
| starter-locs-fade.upkeep.products.1 | oil | eļļa | ab7902bc |  |
| starter-locs-fade.grow_out | Locs mature over 6-12 months. | Loksi nobriest 6–12 mēnešu laikā. | 5d267aa5 |  |
| starter-locs-fade.client | Short locs starting on top with a faded back and sides. Low-key and fresh. | Īsi locs virspusē ar fade pāreju sānos un aizmugurē. Gaumīgs, nepiespiests un svaigs tēls. | 537b623d |  |
| starter-locs-fade.stylist | Grid the scalp, start with coils or two-strand twists and fade the sides. Re-twist every 4-6 weeks. | Sadali matus vienmērīgos kvadrātos, sāc ar cirtām vai divu šķipsnu tvistiem un sānos veido fade. Pārvij ik pēc 4–6 nedēļām. | 74c7775e |  |
| locs-freeform.name | Freeform locs | Freeform locs | 0fbc77f6 | same |
| locs-freeform.sideburns | Natural | Dabiskas | d6acb6d5 |  |
| locs-freeform.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| locs-freeform.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| locs-freeform.texture_fit.curly.note | Possible, but locs may not form evenly. | Iespējams, taču locs var neveidoties vienmērīgi. | 14e43a5f |  |
| locs-freeform.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| locs-freeform.growth.note | Natural locs cover recession. | Dabiskie loksi nosedz atkāpušos matu līniju. | cc1d2670 |  |
| locs-freeform.density_note | Any density; very fine hair forms thinner locs. | Piemērots jebkuram biezumam; ļoti smalki mati veido tievākus loksus. | 7e102c20 |  |
| locs-freeform.glasses_note | Hair may curl or drop over the arms of glasses; trim a clean channel behind the ear if frames sit on top of the hair. | Mati var lokoties vai krist pāri briļļu kājiņām; aiz ausīm izveido tīru līniju, ja rāmis balstās uz matiem. | b7f64717 |  |
| locs-freeform.upkeep.products.0 | shampoo | šampūns | 021624ec |  |
| locs-freeform.upkeep.products.1 | oil | eļļa | ab7902bc |  |
| locs-freeform.grow_out | Locs take years to mature. | Loksu nobriešanai vajadzīgi gadi. | 275e55f2 |  |
| locs-freeform.client | Locs that form on their own, with no parting. Natural and low effort, but not tidy. | Locs, kas veidojas dabiski, bez matu dalījuma. Dabisks stils bez lielām pūlēm, taču nebūs perfekti kārtīgs. | 26ee5fa5 |  |
| locs-freeform.stylist | Teach washing and scalp care, avoid heavy wax and let new growth form its own pattern; a loctician can tidy the roots if wanted. | Pastāsti par pareizu matu mazgāšanu un galvas ādas kopšanu, izvairies no smaga vaska un ļauj ataugušajiem matiem dabiski ieņemt formu; pēc vēlēšanās meistars var sakopt saknes. | c76dc1ed |  |
| locs-long-tied.name | Long locs tied back | Gari, saņemti locs | 632344e8 |  |
| locs-long-tied.sideburns | Natural | Dabiskas | d6acb6d5 |  |
| locs-long-tied.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| locs-long-tied.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| locs-long-tied.texture_fit.curly.note | Possible, but locs may not form evenly. | Iespējams, taču locs var neveidoties vienmērīgi. | 14e43a5f |  |
| locs-long-tied.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| locs-long-tied.density_fit.low.note | Tie loosely; long locs are heavy on sparse roots. | Saņem brīvi; gari locs rada papildu smagumu retām matu saknēm. | 06c0df96 |  |
| locs-long-tied.growth.note | Pulling back exposes the hairline. | Matu saņemšana atpakaļ atsedz matu augšanas līniju. | 50c3fd0d |  |
| locs-long-tied.density_note | Any density. | Piemērots jebkuram biezumam. | 41717f54 |  |
| locs-long-tied.glasses_note | Hair may curl or drop over the arms of glasses; trim a clean channel behind the ear if frames sit on top of the hair. | Mati var lokoties vai krist pāri briļļu kājiņām; aiz ausīm izveido tīru līniju, ja rāmis balstās uz matiem. | b7f64717 |  |
| locs-long-tied.upkeep.products.0 | loc gel | loksu želeja | 22087c9a |  |
| locs-long-tied.grow_out | Locs grow; ties relieve weight. | Loksi turpina augt; matu saņemšana atvieglo smagumu. | 1ed2d28d |  |
| locs-long-tied.client | Long locs tied in a bun or ponytail. Practical, bold and low-fuss. | Gari locs, kas saņemti copē vai astē. Praktiski, pamanāmi un viegli kopjami. | 7c752476 |  |
| locs-long-tied.stylist | Retwist new growth, avoid tight ties at the hairline and trim only if the client asks. Check weight on the scalp. | Pārvij ataugušos matus pie saknēm, izvairies no ciešas saņemšanas pie matu augšanas līnijas un apgriez tikai tad, ja klients to lūdz. Pārliecinies, vai mati nerada lieku smagumu galvas ādai. | 496ccfa1 |  |
| cornrows-fade.name | Cornrows with fade | Cornrows ar fade | ecf1957a |  |
| cornrows-fade.fade.note | Low or mid fade around braids. | Zems vai vidējs fade ap bizēm. | 9f86c5b8 |  |
| cornrows-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| cornrows-fade.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| cornrows-fade.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| cornrows-fade.texture_fit.curly.note | Possible with defined curls; shorter braids. | Iespējams, ja ir izteiktas cirtas; piemērotākas būs īsākas bizes. | 8340eada |  |
| cornrows-fade.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| cornrows-fade.density_fit.low.note | Braid wider rows with low tension; the scalp shows between rows. | Pin platākas rindas bez lieka iestiepuma; starp rindām būs redzama galvas āda. | deefc249 |  |
| cornrows-fade.growth.note | Tight braiding at thin temples causes traction; keep the front looser. | Pārāk cieša pīšana pie retākiem deniņiem rada iestiepumu; priekšpusē pinumu veido brīvāku. | 57b12a5c |  |
| cornrows-fade.density_note | Medium to thick; thin spots may show between rows. | Vidēji līdz biezi mati; retākās vietas var būt redzamas starp celiņiem. | aacd67de |  |
| cornrows-fade.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| cornrows-fade.upkeep.products.0 | oil | eļļa | ab7902bc |  |
| cornrows-fade.grow_out | Braids last 2-3 weeks; after that the hair grows out into a short afro. | Bizes turas 2–3 nedēļas; pēc tam mati ataug par īsu afro. | be8c455b |  |
| cornrows-fade.client | Short braids along the scalp with faded sides. Neat, easy to keep and kind to your hair. | Īsas, gar galvas ādu pītas bizes ar fade pāreju sānos. Glīts, viegli kopjams un matiem saudzīgs stils. | 05b94847 |  |
| cornrows-fade.stylist | Braid straight back at medium tension, keep the hairline looser to avoid traction and fade the sides low or mid. | Pin bizes taisni atpakaļ ar mērenu spriegojumu, pie matu augšanas līnijas pinumu atstāj brīvāku, lai neradītu iestiepumu, un sānos izveido zemo vai vidējo fade. | 7c9f7288 |  |
| box-braids-short.name | Short box braids | Short box braids | 7afdccb9 | same |
| box-braids-short.sideburns | Natural | Dabiskas | d6acb6d5 |  |
| box-braids-short.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| box-braids-short.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| box-braids-short.texture_fit.curly.note | Possible with defined curls. | Iespējams, ja ir izteiktas cirtas. | aa815eb6 |  |
| box-braids-short.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| box-braids-short.density_fit.low.note | Use smaller, lighter braids and low tension at the hairline. | Izvēlies smalkākas, vieglākas bizes un nepārstiep matus pie matu augšanas līnijas. | 76430420 |  |
| box-braids-short.growth.note | Tight installs can cause traction. | Pārāk cieša iepīšana var radīt matu iestiepumu. | 2e1b7d7f |  |
| box-braids-short.density_note | Medium to thick; thin hair needs lighter braids. | Vidēji līdz biezi mati; plāniem matiem vajag vieglākas bizes. | a2f4b674 |  |
| box-braids-short.glasses_note | Hair may curl or drop over the arms of glasses; trim a clean channel behind the ear if frames sit on top of the hair. | Mati var lokoties vai krist pāri briļļu kājiņām; aiz ausīm izveido tīru līniju, ja rāmis balstās uz matiem. | b7f64717 |  |
| box-braids-short.upkeep.products.0 | oil | eļļa | ab7902bc |  |
| box-braids-short.grow_out | Braids last 4-6 weeks; take down before matting. | Bizes turas 4–6 nedēļas; izpin, pirms mati sāk velties. | 6af1874b |  |
| box-braids-short.client | Chin-length box braids. Protects the hair, is easy to style and wears many ways. | Līdz zodam garas box braids. Pasargā matus, ir viegli ieveidojamas un nēsājamas visdažādākajos veidos. | 49cf2e05 |  |
| box-braids-short.stylist | Grid the hair into squares, braid with light tension at the hairline and moisturise the scalp between installs. | Sadali matus kvadrātos, pie matu augšanas līnijas pin ar vieglu nostiepumu un starp pīšanas reizēm mitrini galvas ādu. | 2d135ff6 |  |
| undercut-disconnected.name | Disconnected undercut | Disconnected undercut | cf9ee3b3 | same |
| undercut-disconnected.fade.note | No gradient: a sharp step between the long top and short sides, usually #1-#3. | Bez pārejas: krasa robeža starp garo virspusi un īsajiem sāniem, parasti #1–#3 garumā. | 34e16872 |  |
| undercut-disconnected.sideburns | Short | Īsas | f5d61ead |  |
| undercut-disconnected.texture_fit.curly.note | Curls cling to the top and stand away from the sides. | Cirtas turas augšdaļā un izteikti nodalās no īsajiem sāniem. | 275d4320 |  |
| undercut-disconnected.texture_fit.coily.note | Needs 6 cm to stand; dense hair may hold the step. | Vajadzīgi vismaz 6 cm, lai mati turētos stāvus; biezi mati var noturēt kraso pāreju. | ea18d9fa |  |
| undercut-disconnected.density_fit.low.note | Keep the step lower and softer, or blend it. | Veido pārejas līniju zemāku un maigāku vai sapludini to. | c50391eb |  |
| undercut-disconnected.growth.whorl_note | A whorl can make the top part awkward. | Matu virpulis var apgrūtināt virspuses ieveidošanu. | 3d88ac7c |  |
| undercut-disconnected.growth.note | Long top can be swept forward to cover stage 2-3; not advised beyond. | Garo virspusi var ieveidot uz priekšu, lai piesegtu 2.–3. stadiju; pie lielākas atkāpšanās nav ieteicams. | 722d3f58 |  |
| undercut-disconnected.density_note | Medium to thick; thin hair makes the step line look harsh. | Vidēji līdz biezi mati; plānos matos krasā pārejas līnija izskatīsies pārāk asa. | fd9c3b32 |  |
| undercut-disconnected.glasses_note | Works with most frames. | Piemērots lielākajai daļai briļļu rāmju. | 085e845d |  |
| undercut-disconnected.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| undercut-disconnected.upkeep.products.1 | clay | matu māls | 06363555 |  |
| undercut-disconnected.grow_out | Stop the sides: after about 8-10 weeks you have a mid-length flow; the step softens at 12+ weeks. | Pārtrauc īsināt sānus: pēc apmēram 8–10 nedēļām iegūsi vidēja garuma flow griezumu; asā pāreja izlīdzināsies pēc 12+ nedēļām. | f57cda35 |  |
| undercut-disconnected.client | Very short sides with a clear step up to longer hair on top. The top can be slicked back or swept forward. | Ļoti īsi sāni ar izteiktu pakāpienu uz garākiem matiem virspusē. Virspusi var gludi atglaust atpakaļ vai ieveidot uz priekšu. | 63014a1a |  |
| undercut-disconnected.stylist | Section from the parietal ridge; clip #1 to #3 below, scissor top, no blending. Check the line is level to the ear. Squared or rounded. | Atdali matus pa parietālo līniju; apakšdaļu nogriez ar mašīnīti no #1 līdz #3, augšpusi ar šķērēm, neveidojot pāreju. Pārbaudi, vai līnija ir vienā līmenī ar ausi. Veido taisnu vai noapaļotu formu. | 8aeee35a |  |
| undercut-side-part.name | Undercut with hard side part | Undercut ar izteiktu sānu celiņu | 704f113d |  |
| undercut-side-part.fade.note | Short sides cut close, a defined part line shaved 2 mm deep. | Īsi, gludi nogriezti sāni un izteikta, apmēram 2 mm plata izskūta celiņa līnija. | 6f38ba85 |  |
| undercut-side-part.sideburns | Short | Īsas | f5d61ead |  |
| undercut-side-part.texture_fit.curly.note | Leave the top long enough to comb flat. | Atstāj virspusi pietiekami garu, lai matus varētu gludi pieķemmēt. | d86ce92d |  |
| undercut-side-part.texture_fit.coily.note | Works only with relaxed or very soft coils; use a brush top with part. | Piemērots tikai taisnotiem vai ļoti mīkstiem sīki cirtainiem matiem; virspusi veido ar suku un celiņu. | 79f37e61 |  |
| undercut-side-part.density_fit.low.note | Skip the shaved part line or keep it very fine. | Izskūto celiņa līniju labāk neveidot vai atstāt to pavisam smalku. | fafc248f |  |
| undercut-side-part.growth.whorl_note | Whorl may fight the part. | Matu virpulis var pretoties celiņa virzienam. | 87870c14 |  |
| undercut-side-part.growth.note | Combs the hair across; suits a mature hairline only. | Matus pārķemmē pāri uz sānu; piemērots tikai nobriedušai matu augšanas līnijai. | 7ff31764 |  |
| undercut-side-part.density_note | Medium to thick; thin hair makes the part obvious. | Vidējiem līdz bieziem matiem; plānos matos celiņš būs pārāk uzkrītošs. | c011bee7 |  |
| undercut-side-part.glasses_note | Neat sides leave the frame arms free. | Kārtīgi apgriezti sāni netraucē briļļu kājiņām. | 9211d20b |  |
| undercut-side-part.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| undercut-side-part.upkeep.products.1 | comb | ķemme | ef4e3f50 |  |
| undercut-side-part.grow_out | Stop the clipper work for 8 weeks and it becomes a long side part. | Neaiztiec mašīnīti 8 nedēļas, un tas pārtaps par garāku griezumu ar celiņu sānos. | 3e00ab41 |  |
| undercut-side-part.client | Short sides with a neat comb-over top and a sharply defined parting. Smart and classic. | Īsi sāni, glīti uz vienu pusi saķemmēta virspuse un asi iezīmēts celiņš. Elegants un klasisks stils. | 6cd0c6d1 |  |
| undercut-side-part.stylist | Cut the part with the trimmer after combing, using a lighter touch for symmetrical sides. Combine with a scissor top. | Pēc matu saķemmēšanas iezīmē celiņu ar trimeri, strādājot viegli, lai sāni būtu simetriski. Virspusi griez ar šķērēm. | 64abae2d |  |
| waves-360.name | 360 waves | 360 waves | eed7b0d3 | same |
| waves-360.fade.note | Faded sides; waves form on the top. | Sāni ar fade pāreju; viļņu tekstūra veidojas virspusē. | f96ea8ae |  |
| waves-360.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| waves-360.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| waves-360.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| waves-360.texture_fit.curly.note | Works only on short firm curls; waves need coarse, short hair. | Piemērots tikai īsām, stingrām cirtām; viļņiem nepieciešami raupji, īsi mati. | 2123aa04 |  |
| waves-360.texture_fit.coily.note | Core design; needs coarse short hair. | Klasiskais variants; vajadzīgi īsi, raupji mati. | 16a3b168 |  |
| waves-360.density_fit.low.note | Waves show less on low density; keep the top at about #2 and brush daily. | Retākos matos viļņi izceļas mazāk; virspusē atstāj apmēram #2 garumu un sukā matus katru dienu. | ae4f81b8 |  |
| waves-360.growth.note | Waves highlight the hairline: not advised past stage 3. | Viļņi izceļ matu augšanas līniju: nav ieteicams pēc 3. stadijas. | 715509bb |  |
| waves-360.density_note | Medium to thick coarse hair. | Vidēji līdz biezi, raupji mati. | e071d953 |  |
| waves-360.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| waves-360.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| waves-360.upkeep.products.1 | brush | birste | 029f33c2 |  |
| waves-360.upkeep.products.2 | durag | durag | dea877df | same |
| waves-360.grow_out | Stop brushing and the waves disappear within 2-3 weeks; it grows into a short afro. | Pārtrauc birstēt, un viļņi 2–3 nedēļu laikā pazūd; griezums ataug par īsu afro. | a4ab30ac |  |
| waves-360.client | Very short hair brushed into circular wave patterns that build over a few weeks. | Ļoti īsi mati, ko ar suku ieveido apļveida viļņos, kas pakāpeniski izveidojas vairāku nedēļu laikā. | 2517f747 |  |
| waves-360.stylist | Cut at about #2, brush wet and dry and sleep in a durag; the waves develop over several weeks. | Nogriez apmēram ar #2 uzgali, birstē gan mitrus, gan sausus matus un guli ar durag; viļņi izveidosies dažu nedēļu laikā. | 0ed1bcd5 |  |
| wave-caesar.name | Wave Caesar | Wave Caesar | 5b3af39b | same |
| wave-caesar.fade.note | Low taper; waves flow forward. | Zema taper pāreja; viļņi vērsti uz priekšu. | adbb8452 |  |
| wave-caesar.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| wave-caesar.texture_fit.straight.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| wave-caesar.texture_fit.wavy.note | Not suited. | Nav piemērots. | cfb8ecfd |  |
| wave-caesar.texture_fit.curly.note | Works with short firm curls. | Piemērots īsām, stingrām cirtām. | 8ad8f1ac |  |
| wave-caesar.texture_fit.coily.note | Core design. | Pamatvariants. | f856d1de |  |
| wave-caesar.density_fit.low.note | Waves show less on low density; keep the top short and brush daily. | Retākos matos viļņi izceļas mazāk; virspusē matus atstāj īsus un sukā katru dienu. | 2c7edfdb |  |
| wave-caesar.growth.note | Forward waves cover stage 3-4. | Uz priekšu vērsti viļņi piesedz 3.–4. stadiju. | 78702e11 |  |
| wave-caesar.density_note | Medium to thick coarse hair. | Vidēji līdz biezi, raupji mati. | e071d953 |  |
| wave-caesar.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| wave-caesar.upkeep.products.0 | pomade | pomāde | d3fe5b65 |  |
| wave-caesar.upkeep.products.1 | brush | birste | 029f33c2 |  |
| wave-caesar.grow_out | Allow the sides to grow and the waves to loosen: it becomes a short curly top in about 4 weeks. | Ļauj ataugt sāniem un viļņiem atslābt: apmēram 4 nedēļu laikā tas pārtop par īsu, cirtainu griezumu virspusē. | 969bda72 |  |
| wave-caesar.client | Short waves brushed forward with a small fringe. Neat, classic and sharp. | Uz priekšu sukāti īsi viļņi ar nelieliem priekšmatiem. Kopts, klasisks un precīzs griezums. | 0676479d |  |
| wave-caesar.stylist | Leave 1-1.5 cm, brush forward with pomade and wrap overnight; the fringe frames the forehead. | Atstāj 1–1,5 cm, birstē uz priekšu ar pomādi un uz nakti apsien; priekšmati ierāmē pieri. | c312c67f |  |
| wolf-cut.name | Wolf cut | Wolf cut | 446c72cd | same |
| wolf-cut.texture_fit.curly.note | cut dry on loose waves and keep the top layers longer | griez sausos matos, ja tie ir viegli viļņaini, un atstāj virsējos slāņus garākus | 34eb4dce |  |
| wolf-cut.texture_fit.coily.note | cut dry; see Curly wolf cut | griez sausos matos; skat. Curly wolf cut | 011213ab |  |
| wolf-cut.density_fit.low.note | fine hair becomes see-through at the nape, keep the back fuller | smalki mati pakauša lejasdaļā spīd cauri, tāpēc aizmugurē atstāj lielāku apjomu | 70c5b1c0 |  |
| wolf-cut.density_fit.high.note | thick hair holds the shape well | biezi mati labi tur formu | 210338e0 |  |
| wolf-cut.growth.note | The crown layers stand up; avoid cutting them short around a whorl. | Kārtas galvvidū ceļas uz augšu; virpuļa zonā izvairies tās nogriezt pārāk īsas. | b017db7d |  |
| wolf-cut.strand_note | Medium to thick strands hold the contrast; fine strands need softer layers. | Vidēji un biezi mati labi notur kontrastu; smalkiem matiem vajadzīgas maigākas pakāpes. | bb978ceb |  |
| wolf-cut.upkeep.products.0 | texturising spray | teksturējošs sprejs | 1544201e |  |
| wolf-cut.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| wolf-cut.grow_out | Grows into a long shag or butterfly cut. | Ataug par garu shag vai butterfly griezumu. | f1a719b8 |  |
| wolf-cut.client | A bold, shaggy cut with short, choppy layers at the crown and longer, wispy lengths at the back. A curtain fringe falls to the cheekbones. | Drosmīgs, nedaudz izspūris griezums ar īsiem, teksturētiem slāņiem galvvidū un garākiem, gaisīgiem matiem aizmugurē. Curtain priekšmati sniedzas līdz vaigu kauliem. | 71dd1f96 |  |
| wolf-cut.stylist | Create a short crown section, graduate into longer layers at the nape and point cut the ends to give a feathered finish. Weight: short, voluminous crown layers with long, wispy lengths at the nape. | Veido īsu zonu galvvidū, pakāpeniski pārejot garākās kārtās pie kakla līnijas, un apstrādā galus ar point cut tehniku, lai iegūtu gaisīgu efektu. Svara sadalījums: īsas, kuplas kārtas galvvidū ar gariem, viegliem matu galiem pie kakla. | 2093d2d4 |  |
| soft-wolf-lite.name | Soft wolf-lite | Soft wolf-lite | 1fd71ea6 | same |
| soft-wolf-lite.texture_fit.curly.note | cut dry and keep the crown layers longer | griez sausos matos un atstāj galvvidus slāņus garākus | 0eeacc74 |  |
| soft-wolf-lite.texture_fit.coily.note | cut dry and allow 6-8 cm for shrinkage | griez sausos matos un rēķinies ar 6–8 cm saraušanos | 822d4e75 |  |
| soft-wolf-lite.growth.note | Crown layers are a little longer, so cowlicks are less of a problem. | Kārtas galvvidū ir nedaudz garākas, tāpēc matu virpuļi rada mazāk problēmu. | a1d3acf4 |  |
| soft-wolf-lite.strand_note | Fine to thick strands all work because the contrast is mild. | Piemērots gan smalkiem, gan bieziem matiem, jo kontrasts ir pavisam maigs. | 12fe5133 |  |
| soft-wolf-lite.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| soft-wolf-lite.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| soft-wolf-lite.grow_out | Grows into a long layered cut without a visible step. | Ataug par garu pakāpenisku griezumu bez pamanāmas pārejas. | 368ec370 |  |
| soft-wolf-lite.client | A softer take on the wolf cut, with gentle layers and no strong contrast. | Maigāka wolf cut versija ar plūstošiem slāņiem un bez izteikta kontrasta. | bed4ba12 |  |
| soft-wolf-lite.stylist | Keep the crown layers 5-8 cm longer than for a full wolf, and blend the graduation into the lengths with point cutting. Weight: moderate crown layers that blend smoothly to the lengths, with no hard drop. | Saglabā kārtas galvvidū par 5–8 cm garākas nekā klasiskajam wolf cut un ar point cut tehniku sapludini gradāciju ar kopējo garumu. Svara sadalījums: mērenas kārtas galvvidū, kas vienmērīgi saplūst ar garumu, bez krasas pārejas. | c6a8db28 |  |
| modern-mullet.name | Modern mullet | Modern mullet | bcb0ada2 | same |
| modern-mullet.texture_fit.curly.note | keep the top 2 cm longer on loose curls | vaļīgām cirtām atstāj virspusi par 2 cm garāku | c329cad7 |  |
| modern-mullet.texture_fit.coily.note | keep the top and sides 3 cm longer; see Curly mullet | atstāj virspusi un sānus par 3 cm garākus; skat. Curly mullet | c153994d |  |
| modern-mullet.density_fit.low.note | fine hair thins out in the tail, so keep it blunt | smalki mati aizmugurējā daļā kļūst pārāk plāni, tāpēc veido taisnu griezumu bez filēšanas | af3e8279 |  |
| modern-mullet.growth.note | Check for a low nape hairline or whorl before leaving the back long. | Pirms aizmugurē atstāj garus matus, pārbaudi, vai kakla daļā nav zema matu augšanas līnija vai virpulis. | a8b04302 |  |
| modern-mullet.strand_note | Medium to thick strands support the contrast; fine strands look sparse in the tail. | Vidēji un biezi mati labi notur kontrastu; smalki mati aizmugurē var izskatīties pārāk plāni. | e57d8181 |  |
| modern-mullet.upkeep.products.0 | texturising paste | teksturējoša pasta | 5811656a |  |
| modern-mullet.upkeep.products.1 | strong wax | stipras fiksācijas vasks | b27c9316 |  |
| modern-mullet.grow_out | The tail can be left to grow into a long cut while the top is trimmed. | Asti var atstāt ataugt garākam griezumam, kamēr virspusi pielīdzina. | 892cd567 |  |
| modern-mullet.client | Short on top and sides with a longer tail at the back. | Īsi mati virspusē un sānos ar garāku matu daļu aizmugurē. | 221d5aab |  |
| modern-mullet.stylist | Disconnect the back from the sides at the crown, taper the tail and keep the top texturised. Weight: short top and sides disconnected from a long, tapered back. | Galvvidū atdali aizmuguri no sāniem, pakāpeniski sašaurini asti un teksturē virspusi. Svara sadalījums: īsa virspuse un sāni, kas atdalīti no garas, pakāpeniski sašaurinātas mugurpuses. | 0cd2bf86 |  |
| curly-wolf-cut.name | Curly wolf cut | Curly wolf cut | f5954bfe | same |
| curly-wolf-cut.texture_fit.wavy.note | waves need styling | viļņainiem matiem vajadzīga ieveidošana | 2ae4dbde |  |
| curly-wolf-cut.density_fit.low.note | fine curls look sparse at the nape, so keep the tail dense | smalkas cirtas pakauša lejasdaļā izskatās retas, tāpēc aizmuguri saglabā biezāku | dd5e7079 |  |
| curly-wolf-cut.growth.note | Crown layers must be longer around a whorl. | Virpuļa zonā kārtām galvvidū jābūt garākām. | ccef35de |  |
| curly-wolf-cut.strand_note | Dense curls hold the contrast between crown and length; looser or finer curls blur it and look closer to a long shag. | Biezas cirtas labi notur kontrastu starp galvvidu un garumu; vaļīgākas vai smalkākas cirtas to sapludina un vairāk atgādina garu shag griezumu. | d1dbbdeb |  |
| curly-wolf-cut.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-wolf-cut.upkeep.products.1 | diffuser | difuzors | 5b517416 |  |
| curly-wolf-cut.grow_out | The contrast softens in about 3 months and the cut becomes a curly long shag with no awkward stage. | Kontrasts izlīdzinās apmēram 3 mēnešu laikā, un griezums bez neērtā ataugšanas posma pārtop par garu, cirtainu shag. | 0b45942b |  |
| curly-wolf-cut.client | A curly wolf cut: a rounded crown of short layered curls, a curly curtain fringe and longer curls at the back. | Cirtains wolf cut: noapaļota virspuse ar īsām, pakāpeniskām cirtām, cirtaini curtain priekšmati un garākas cirtas aizmugurē. | 15b902aa |  |
| curly-wolf-cut.stylist | Cut the crown dry, curl by curl, and leave the back longer. Weight: a rounded crown of layered curls over longer curls at the nape. | Griez galvvidu sausos matos, loku pa lokai, un atstāj aizmuguri garāku. Svara sadalījums: noapaļots kārtās veidotu loku apjoms galvvidū virs garākām lokām kakla daļā. | a1d68eef |  |
| curly-mullet-salon.name | Curly mullet | Cirtainais mullets | d2d818bc |  |
| curly-mullet-salon.texture_fit.wavy.note | waves need styling | viļņainiem matiem vajadzīga ieveidošana | 2ae4dbde |  |
| curly-mullet-salon.density_fit.low.note | fine curls thin out in the tail, so keep it dense | smalkas cirtas aizmugurē kļūst pārāk plānas, tāpēc saglabā biezumu | b8c6e008 |  |
| curly-mullet-salon.growth.note | A nape whorl can twist or split the tail, so check the nape before deciding how long it stays. | Virpulis pie kakla līnijas var sagriezt vai sašķelt asti, tāpēc pirms garuma izvēles novērtē kakla zonu. | 160346d0 |  |
| curly-mullet-salon.strand_note | Dense curls keep the contrast between the short top and the tail; fine curls make the tail look wispy. | Biezas cirtas saglabā kontrastu starp īso virspusi un garo aizmuguri; smalku cirtu dēļ aizmugure var izskatīties paplāna un gaisīga. | 5a85c8e3 |  |
| curly-mullet-salon.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-mullet-salon.upkeep.products.1 | light gel | vieglas fiksācijas želeja | ffdb7497 |  |
| curly-mullet-salon.grow_out | The top grows toward the tail over about 6 months, and the tail can be kept as a feature while the top is trimmed. | Virspuse ataug līdz astes garumam apmēram 6 mēnešu laikā, un asti var saglabāt kā akcentu, kamēr virspusi pielīdzina. | 331e6ba0 |  |
| curly-mullet-salon.client | Short, rounded curls on top and at the sides with longer curls at the back. | Īsas, noapaļotas cirtas augšdaļā un sānos ar garākām cirtām aizmugurē. | 37a0dbee |  |
| curly-mullet-salon.stylist | Cut dry and keep the tail in curl clusters. Weight: short, rounded curls on top and sides with a longer tail at the back. | Griez sausos matos un saglabā asti izteiktās loku šķipsnās. Svara sadalījums: īsas, noapaļotas lokas virspusē un sānos ar garāku asti aizmugurē. | 9487d67a |  |
| mullet-classic.name | Classic mullet | Klasiskais mullets | 2321af26 |  |
| mullet-classic.sideburns | Short to mid, tapered | Īsi līdz vidēji gari, ar taper pāreju | 83fbc168 |  |
| mullet-classic.texture_fit.wavy.note | Natural wave gives the back its shape. | Dabiskais viļņojums piešķir formu aizmugurei. | 0fb0408c |  |
| mullet-classic.texture_fit.curly.note | Cut dry; keep weight at the back. | Griez sausos matos; saglabā apjomu aizmugurē. | 9a07b0fa |  |
| mullet-classic.texture_fit.coily.note | Back length needs 10+ cm; shape with a pick or twists. | Aizmugurē vajag 10+ cm; ieveido ar afro ķemmi vai veido tvistus. | aa5990d8 |  |
| mullet-classic.density_fit.low.note | Keep the back shorter and blunt so it does not look stringy. | Aizmuguri atstāj īsāku un griez taisnu, lai mati neizskatītos izplūkāti. | 5a9c0ca6 |  |
| mullet-classic.growth.whorl_note | Crown whorl affects where the back drops; cut the transition below it. | Virpulis galvvidū ietekmē to, kur krīt aizmugures mati; veido pāreju zem tā. | 457b3d30 |  |
| mullet-classic.growth.note | Short fringe covers temples; avoid brushing back. | Īsi priekšmati nosedz deniņus; izvairies ķemmēt matus atpakaļ. | 71a9a633 |  |
| mullet-classic.density_note | Medium to thick; thin hair makes the back look stringy. | Vidējiem līdz bieziem matiem; plāni mati aizmugurē izskatīsies šķidri. | f98572eb |  |
| mullet-classic.glasses_note | Short sides leave the frame arms free. | Īsie sāni atstāj briļļu kājiņas brīvas. | 8bbe616f |  |
| mullet-classic.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| mullet-classic.upkeep.products.1 | light cream | viegls krēms | d9b92bf2 |  |
| mullet-classic.grow_out | Even out to a shag or flow over 3-4 months. | 3–4 mēnešu laikā var izlīdzināt par shag vai flow griezumu. | c0894bad |  |
| mullet-classic.client | Short, textured top and sides with a longer back. A bold, playful look that suits confident wearers. | Īsa, teksturēta virspuse un sāni ar garākiem matiem aizmugurē. Drosmīgs, rotaļīgs tēls pārliecinātām personībām. | de26714c |  |
| mullet-classic.stylist | Section the back from the crown; cut the long back square or V. Blend sides into the nape with scissors. Back length hangs freely over the collar. | Atdali aizmuguri no galvvidus; veido garo aizmuguri taisnu vai V veidā. Ar šķērēm sapludini sānus ar kakla zonu. Aizmugures garums brīvi sniedzas pāri apkaklei. | 109e8f61 |  |
| mullet-soft-short.name | Soft short mullet | Maigais īsais mullets | 22f23af8 |  |
| mullet-soft-short.fade.note | Light taper at the sides; short nape tail. | Viegla taper pāreja sānos; īsa astīte pakausī. | d3909b0b |  |
| mullet-soft-short.sideburns | Short, tapered | Īsi, ar taper pāreju | b33481a3 |  |
| mullet-soft-short.texture_fit.curly.note | Back length shows curl. | Garums aizmugurē izceļ lokas. | edc1e5d1 |  |
| mullet-soft-short.texture_fit.coily.note | Short nape tail of 6-8 cm; keep it moisturised. | Īsa 6-8 cm gara astīte pakausī; regulāri to mitrini. | 23f9ebe4 |  |
| mullet-soft-short.growth.note | Fringe covers temples; the short top keeps stage 3-4 hairlines less obvious. | Priekšmati nosedz deniņus; īsā virspuse padara 3.–4. stadijas matu augšanas līniju mazāk pamanāmu. | 28830517 |  |
| mullet-soft-short.density_note | Any; the shorter nape tail is easier on thin hair. | Jebkuram biezumam; īsāka aste kakla daļā ir labāk piemērota plāniem matiem. | 4071da50 |  |
| mullet-soft-short.glasses_note | No issue: the sides stay short. | Nekādu problēmu: sāni paliek īsi. | 366ab37f |  |
| mullet-soft-short.upkeep.products.0 | paste | matu pasta | a2c183d5 |  |
| mullet-soft-short.grow_out | Can be trimmed back to a crop. | Var pielīdzināt uz crop griezumu. | ef6a72fc |  |
| mullet-soft-short.client | A modern, discreet mullet with a short nape tail. Fits office dress better than the classic. | Mūsdienīgs, neuzkrītošs mullets ar īsu astīti pakausī. Biroja stilam piemērotāks par klasisko variantu. | 98dbef19 |  |
| mullet-soft-short.stylist | Keep the back at 6-10 cm, point cut the ends and use a gentle taper on the sides. Check the transition behind the ears. Back falls to the collar line. | Saglabā aizmuguri 6–10 cm garumā, galus griez ar point cut tehniku un sānos veido maigu taper pāreju. Pārbaudi pāreju aiz ausīm. Aizmugure sniedzas līdz apkakles līnijai. | 092d66d8 |  |
| mullet-burst-fade.name | Mullet with burst fade | Mullets ar burst fade | bac09790 |  |
| mullet-burst-fade.fade.note | Burst fade curves around the ear, back untouched. | Burst fade izliecas ap ausi, aizmugure paliek neskarta. | 5a48162f |  |
| mullet-burst-fade.sideburns | Faded | Ar fade pāreju | 5ed24b77 |  |
| mullet-burst-fade.texture_fit.curly.note | Great with curls. | Lieliski izskatās ar lokām. | 5cea51bc |  |
| mullet-burst-fade.texture_fit.coily.note | Excellent with a defined back. | Lieliski izskatās ar izteiksmīgu aizmuguri. | 8fd79bd2 |  |
| mullet-burst-fade.density_fit.low.note | Keep the back shorter and blunt so it does not look stringy. | Aizmuguri atstāj īsāku un griez taisnu, lai mati neizskatītos izplūkāti. | 5a9c0ca6 |  |
| mullet-burst-fade.growth.note | Short fringe or textured top covers the temples. | Īsi priekšmati vai teksturēta virspuse nosedz deniņus. | 3f78db31 |  |
| mullet-burst-fade.density_note | Medium to thick; fine hair thins at the long back. | Vidējiem līdz bieziem matiem; smalki mati garajā aizmugurē izskatīsies pārāk plāni. | 2d127c91 |  |
| mullet-burst-fade.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| mullet-burst-fade.upkeep.products.0 | paste | matu pasta | a2c183d5 |  |
| mullet-burst-fade.upkeep.products.1 | salt spray | sāls sprejs | c60ddfa7 |  |
| mullet-burst-fade.grow_out | Burst fades need touch-ups every 3 weeks; to grow out, let the sides grow and cut the back shorter. | Burst fade jāatjauno ik pēc 3 nedēļām; lai ataudzētu, laid garākus sānus un saīsini aizmuguri. | 8d6e5e58 |  |
| mullet-burst-fade.client | A sharp fade curving around the ears and a long back. Trendy and clean. | Izteiksmīgs fade ap ausīm un garāka aizmugure. Mūsdienīgi un kopti. | cd7f84cf |  |
| mullet-burst-fade.stylist | Mark the burst arc with a trimmer, blend through #0.5, #1 and #2, then free the back at 10-20 cm and scissor the ends. | Iezīmē burst loku ar trimeri, sapludini ar #0.5, #1 un #2 uzgaļiem, tad atstāj aizmuguri 10–20 cm garumā un galus apstrādā ar šķērēm. | ddcda10b |  |
| wolf-cut-men.name | Wolf cut | Wolf cut | 446c72cd | same |
| wolf-cut-men.sideburns | Blended | Sapludinātas | 80749709 |  |
| wolf-cut-men.texture_fit.wavy.note | Layers show. | Pakāpes labi izceļas. | 11676937 |  |
| wolf-cut-men.texture_fit.curly.note | Shape with layers. | Veido formu ar pakāpēm. | 4ddd700c |  |
| wolf-cut-men.texture_fit.coily.note | Curl pattern needs shorter layers. | Šādam cirtu tipam vajadzīgas īsākas pakāpes. | 0aab6614 |  |
| wolf-cut-men.density_fit.low.note | Use fewer layers so the shape keeps its weight. | Veido mazāk pakāpju, lai forma saglabātu biezumu. | fcd975f2 |  |
| wolf-cut-men.growth.note | Shaggy fringe covers stage 3. | Izspūruši priekšmati nosedz 3. stadiju. | 8e498545 |  |
| wolf-cut-men.density_note | Medium; thin hair looks sparse. | Vidējam biezumam; plāni mati izskatīsies pārāk šķidri. | 25025166 |  |
| wolf-cut-men.glasses_note | Fine; hair may fall over the arm. | Viss kārtībā; mati var krist pāri briļļu kājiņai. | 378c501a |  |
| wolf-cut-men.upkeep.products.0 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| wolf-cut-men.grow_out | Easy: the layers soften into a shag after about 3 months. | Viegli: pakāpes apmēram 3 mēnešu laikā dabiski pārtop par shag. | 49041da3 |  |
| wolf-cut-men.client | Shaggy layers with a messy fringe and a longer back. A modern, textured shape. | Brīvi krītošas pakāpes, izspūruši priekšmati un garāka aizmugure. Mūsdienīgs, teksturēts griezums. | f1fa02fe |  |
| wolf-cut-men.stylist | Cut short layers on top and long layers at the back, razor the ends for movement and keep weight at the crown. | Griez īsas pakāpes virspusē un garas pakāpes aizmugurē, apstrādā galus ar žileti kustīgumam un saglabā apjomu galvvidū. | 85d1723a |  |
| curly-mullet.name | Curly mullet | Cirtainais mullets | d2d818bc |  |
| curly-mullet.fade.note | Optional burst fade around the ears. | Pēc izvēles – burst fade ap ausīm. | 564e1c10 |  |
| curly-mullet.sideburns | Short | Īsas | f5d61ead |  |
| curly-mullet.texture_fit.straight.note | Not suited: use a classic mullet. | Nav piemērots: labāk izvēlies klasisko mulletu. | e079b910 |  |
| curly-mullet.texture_fit.wavy.note | Waves form soft curls. | Viļņaini mati veido mīkstas cirtas. | 3e398031 |  |
| curly-mullet.texture_fit.curly.note | Core design. | Pamatvariants. | f856d1de |  |
| curly-mullet.texture_fit.coily.note | Good with twists at the back. | Labi izskatās ar savītām šķipsnām (twists) aizmugurē. | 4be13692 |  |
| curly-mullet.density_fit.low.note | Keep the back shorter so the curls do not look stringy. | Aizmuguri atstāj īsāku, lai cirtas neizskatītos izplūkātas. | 228e3363 |  |
| curly-mullet.growth.note | Curls cover the temples. | Lokas nosedz deniņus. | 13c4dad4 |  |
| curly-mullet.density_note | Medium to thick; fine curls look stringy at length. | Vidējiem līdz bieziem matiem; smalkas lokas garumā izskatīsies šķidras. | 0b6c20ea |  |
| curly-mullet.glasses_note | Bare or faded sides expose the frame arms completely; choose frames with narrow temples or keep the fade low so nothing snags. | Noskūti vai ar fade veidoti sāni pilnībā atsedz briļļu kājiņas; izvēlies ietvaru ar šaurām kājiņām vai veido zemu fade, lai nekas neķertos. | f711ae68 |  |
| curly-mullet.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| curly-mullet.grow_out | Trim the back gradually to move into a curly flow. | Pakāpeniski saīsini aizmuguri, lai pārietu uz cirtainu flow griezumu. | 6c23d55a |  |
| curly-mullet.client | Short curls on top and at the sides with a longer curly back below the collar. | Īsas cirtas augšdaļā un sānos ar garākām cirtām aizmugurē, kas sniedzas zem apkakles. | 0b58ec43 |  |
| curly-mullet.stylist | Cut dry. Shape the top short with curl clumps, taper the sides and let the back hang. Avoid hard lines at the nape. | Griez sausos matos. Veido virspusi īsu ar izteiktām loku grupām, sānos veido taper pāreju un ļauj aizmugurei brīvi krist. Izvairies no asām līnijām kakla daļā. | 5e079d03 |  |
| long-wolf-cut.name | Long wolf cut | Garais wolf cut | aeb5c767 |  |
| long-wolf-cut.texture_fit.curly.note | see long-curly-wolf-cut | skatīt long-curly-wolf-cut | 696780a8 |  |
| long-wolf-cut.texture_fit.coily.note | see long-curly-wolf-cut | skatīt long-curly-wolf-cut | 696780a8 |  |
| long-wolf-cut.density_fit.low.note | the thin tail looks stringy on fine hair | smalkos matos plānā aste izskatās izplūkāta | 946a404a |  |
| long-wolf-cut.density_fit.high.note | thick hair holds the shape well | biezi mati labi tur formu | 210338e0 |  |
| long-wolf-cut.growth.note | The crown layers stand up, so keep them longer around a whorl. | Pakāpes galvvidū ceļas uz augšu, tāpēc virpuļa zonā atstāj tās garākas. | 6e433c11 |  |
| long-wolf-cut.strand_note | Medium to thick strands hold the contrast. Fine strands leave a stringy tail. | Vidēji bieza līdz bieza matu struktūra labi notur kontrastu. Smalkos matos aste izskatīsies izplūkāta. | e109ddaa |  |
| long-wolf-cut.upkeep.products.0 | texturising spray | teksturējošs sprejs | 1544201e |  |
| long-wolf-cut.upkeep.products.1 | sea-salt spray | jūras sāls sprejs | 4e601d9c |  |
| long-wolf-cut.grow_out | The step softens in about 3 months and the cut becomes a long shag. | Pāreja izlīdzinās apmēram 3 mēnešu laikā, un griezums pārtop par garu shag. | 8c3dd935 |  |
| long-wolf-cut.client | A bold cut with a round, choppy crown that stops at the jaw and a much thinner tail that falls long. A curtain fringe falls to the cheekbones. | Drosmīgs griezums ar apaļīgu, izteikti pakāpenisku augšdaļu līdz žokļa līnijai un krietni plānākiem, gariem matiem aizmugurē. Aizkarveida priekšmati sniedzas līdz vaigu kauliem. | da171be0 |  |
| long-wolf-cut.stylist | Cut heavy, rounded layers at the crown (8-16 cm) and stop them at the jaw. Blend them fast into a noticeably thinner long tail (42-58 cm), so the outline narrows below the jaw. If the tail stays wide, the shape is a long shag. Short crown layers fall out of a ponytail. Weight: heavy, rounded crown layers over a thin, long tail. | Veido izteiktas, noapaļotas pakāpes galvvidū (8–16 cm), kas beidzas pie žokļa līnijas. Ātri sapludini tās ar manāmi plānāku garo asti (42–58 cm), lai siluets zem žokļa sašaurinātos. Ja aste paliek plata, forma būs garš shag. Īsās galvvidus pakāpes kritīs ārā no astes (ponytail). Svara sadalījums: izteiktas, noapaļotas pakāpes galvvidū virs plānas, garas astes. | 98dc2817 |  |
| long-curly-wolf-cut.name | Long curly wolf cut | Garais cirtainais wolf cut | 79c630c5 |  |
| long-curly-wolf-cut.texture_fit.straight.note | no curl to shape the cut around | nav cirtu, pēc kurām veidot griezumu | 83db5b7e |  |
| long-curly-wolf-cut.texture_fit.wavy.note | waves need styling and may blur the step | viļņainiem matiem vajadzīga ieveidošana, un pāreja var nebūt tik izteikta | f84f6ab3 |  |
| long-curly-wolf-cut.texture_fit.curly.note | tight 3C curls shrink most, so keep the crown a little longer | stingras 3C lokas saraujas visvairāk, tāpēc atstāj galvvidu nedaudz garāku | dcbf321e |  |
| long-curly-wolf-cut.texture_fit.coily.note | the crown shrinks to a cap | augšdaļa sarausies kā cepurīte | de2929fb |  |
| long-curly-wolf-cut.density_fit.low.note | fine curls leave a sparse tail | smalkas cirtas veido retu asti | ef667f5e |  |
| long-curly-wolf-cut.growth.note | The crown layers must be longer around a whorl. | Virpuļa zonā pakāpēm galvvidū jābūt garākām. | 36f07be3 |  |
| long-curly-wolf-cut.strand_note | Dense curls hold the contrast between crown and tail. Fine or looser curls blur it. | Biezas cirtas saglabā kontrastu starp augšdaļu un garumu aizmugurē. Smalkas vai brīvākas cirtas to izpludina. | a83d80aa |  |
| long-curly-wolf-cut.upkeep.products.0 | curl cream | loku krēms | a180aed0 |  |
| long-curly-wolf-cut.upkeep.products.1 | diffuser | difuzors | 5b517416 |  |
| long-curly-wolf-cut.grow_out | The step softens in about 3 months into a curly long shag, with no awkward stage. | Pāreja apmēram 3 mēnešu laikā izlīdzinās un pārtop par cirtainu garo shag bez neērtā ataugšanas posma. | e4cbfbb4 |  |
| long-curly-wolf-cut.client | A curly wolf cut with a rounded crown of short curls and a springy curly fringe. The tail is longer and narrower. Dry, the tail lands just below the shoulders. | Cirtains wolf cut ar noapaļotu īsu cirtu augšdaļu un atsperīgiem, cirtainiem priekšmatiem. Aizmugurējā daļa ir garāka un šaurāka. Kad mati izžūst, garums sniedzas tieši zem pleciem. | c8bb00f6 |  |
| long-curly-wolf-cut.stylist | Cut dry, curl by curl. Build a rounded crown mass (12-24 cm) that stops at the jaw, over a clearly narrower tail. Plan for 30-55% shrinkage: at a typical 35% the back lands at about 31-43 cm, so the tail clears the shoulder. Keep the crown at 12 cm or more so it does not sit as a cap. Close to a curly long shag, which has no narrow tail. Weight: a rounded crown over a narrower tail. | Griez sausos matos, loku pa lokai. Veido noapaļotu matu masu galvvidū (12–24 cm), kas beidzas pie žokļa, virs izteikti šaurākas astes. Rēķinies ar 30–55% saraušanos: pie tipiskiem 35% aizmugure sasniegs apmēram 31–43 cm, lai aste brīvi kristu pāri plecam. Saglabā galvvidu vismaz 12 cm garu, lai tas neizskatītos kā cepure. Ļoti līdzīgs cirtainajam garajam shag, kam nav šauras astes. Svara sadalījums: noapaļots galvvidus virs šaurākas astes. | e69ad8b8 |  |
| salon-straight-wavy.label | Straight to wavy hair | Taisni līdz viļņaini mati | 66319862 |  |
| salon-straight-wavy.shown_on | Shown on straight to wavy hair | Parādīts uz taisniem līdz viļņainiem matiem | 64b395f9 |  |
| salon-curly-coily.label | Curly to coily hair | Cirtaini līdz sīki cirtaini mati | a9848700 |  |
| salon-curly-coily.shown_on | Shown on 3C to 4A curls and coils | Parādīts uz 3C līdz 4A tipa cirtām | 5b2281a1 |  |
| barbering-straight-wavy.label | Straight to wavy hair | Taisni līdz viļņaini mati | 66319862 |  |
| barbering-straight-wavy.shown_on | Shown on straight to wavy hair | Parādīts uz taisniem līdz viļņainiem matiem | 64b395f9 |  |
| barbering-curly-coily.label | Curly to coily hair | Cirtaini līdz sīki cirtaini mati | a9848700 |  |
| barbering-curly-coily.shown_on | Shown on 3C to 4A curls and coils | Parādīts uz 3C līdz 4A tipa cirtām | 5b2281a1 |  |
| phrases.beard_blend.true | sides that blend into a beard | sāni, kas saplūst ar bārdu | bed8fb23 |  |
| phrases.beard_length.short | a short length | īss garums | 510b7e3f |  |
| phrases.contrast_with_natural.low | a colour close to your natural shade | tonis, kas tuvs tavam dabiskajam | 43280bc3 |  |
| phrases.contrast_with_natural.medium | a gentle contrast with your natural colour | maigs kontrasts ar tavu dabisko matu krāsu | aba68336 |  |
| phrases.covers_ears.false | the ears on show | atsegtas ausis | 25e6ae1b |  |
| phrases.covers_ears.true | length over the ears | mati pāri ausīm | 3e804a28 |  |
| phrases.covers_forehead.false | an open forehead | atsegta piere | ca705751 |  |
| phrases.covers_forehead.true | hair over the forehead | mati pār pieri | 6e8e93c5 |  |
| phrases.cut_method.dry_shaped | shaping done dry, curl by curl | griezts sausos matos, cirta pa cirtai | 2a74b7d6 |  |
| phrases.family.brunette | a brunette shade | brūns tonis | 7d8e1b99 |  |
| phrases.family.grey_silver | a grey or silver finish | pelēks vai sudraba tonis | b27fb4d3 |  |
| phrases.fringe.curtain | a curtain fringe | aizkarveida priekšmati | 2925438a |  |
| phrases.fringe.long_side | a long side fringe | gari slīpi priekšmati | 3ab0ca4b |  |
| phrases.fringe.none | no fringe | bez priekšmatiem | fa02e938 |  |
| phrases.fringe.short_blunt | a short blunt fringe | īsi, taisni priekšmati | d54a232a |  |
| phrases.fringe.side_swept | a side-swept fringe | slīpi priekšmati | 135d52f5 |  |
| phrases.fringe.textured_forward | a textured fringe brushed forward | uz priekšu veidoti teksturēti priekšmati | ce2e7935 |  |
| phrases.fringe.wispy | a wispy fringe | gaisīgi priekšmati | 4bc45bdc |  |
| phrases.grow_out_friendly.true | an easy grow-out | viegli ataudzējams griezums | b4380d8f |  |
| phrases.heat_dependent.false | a shape that works without heat styling | griezums, kas labi izskatās bez ieveidošanas ar karstumu | d09ec585 |  |
| phrases.height_top.flat | very little height on top | minimāls apjoms augšdaļā | 90154093 |  |
| phrases.height_top.low | low height on top | neliels apjoms augšdaļā | d8983832 |  |
| phrases.height_top.medium | some height on top | mērens apjoms augšdaļā | e44d12ca |  |
| phrases.height_top.high | height on top | izteikts apjoms augšdaļā | 3a8145ec |  |
| phrases.layers.chin_level | layers at chin level | pakāpes zoda līmenī | 1c3483b7 |  |
| phrases.layers.face_framing | face-framing layers | seju ierāmējošas pakāpes | 372c2d24 |  |
| phrases.layers.internal | inner layers that remove weight | iekšējās pakāpes smaguma noņemšanai | 09ac8c4b |  |
| phrases.layers.light | light layers | vieglas pakāpes | 0cef8ca2 |  |
| phrases.layers.long_layers | long layers | garas pakāpes | 3b2d2915 |  |
| phrases.layers.medium | medium layers | vidējas pakāpes | a9cc4e02 |  |
| phrases.layers.none | one length without layers | viens garums bez pakāpēm | 29cf0b53 |  |
| phrases.length_change.large | a big change in length | ievērojama garuma maiņa | f45666da |  |
| phrases.length_change.small | a length close to yours | garums, kas tuvs tavam tagadējam | f7f169f2 |  |
| phrases.length_class.bob | a collarbone length | garums līdz atslēgas kaulam | 29a60c79 |  |
| phrases.length_class.buzz | a buzz length | ezīša garums | 73222121 |  |
| phrases.length_class.chin | a jaw-to-chin length | garums no žokļa līdz zodam | 1a4981ec |  |
| phrases.length_class.long | a long length | gari mati | e0abf4b7 |  |
| phrases.length_class.short | a short length | īss garums | 510b7e3f |  |
| phrases.length_class.shoulder | shoulder length | garums līdz pleciem | dcc406d5 |  |
| phrases.length_class.very_short | a very short length | ļoti īss garums | e42ff53a |  |
| phrases.length_direction.shorter | a shorter length than you have now | īsāks garums nekā tev ir tagad | 42c9ab47 |  |
| phrases.lift_levels.1-3 | colour a little lighter than your hair now | nedaudz gaišāks tonis par taviem pašreizējiem matiem | 9ef8a309 |  |
| phrases.lift_levels.-3--1 | colour a little darker than your hair now | krāsa nedaudz tumšāka par taviem matiem šobrīd | 60327927 |  |
| phrases.lift_levels.-1-1 | colour at about the depth you have now | krāsa apmēram tavā pašreizējā toņa dziļumā | e420c9c4 |  |
| phrases.lift_levels.-1-0 | colour at about the depth you have now | krāsa apmēram tavā pašreizējā toņa dziļumā | e420c9c4 |  |
| phrases.lift_levels.-3-2 | a shade close to what you have now | tonis, kas tuvs tavam pašreizējam | 87e5981f |  |
| phrases.lift_levels.-3-4 | colour blended around the depth you have now | tonis, kas sapludināts ap tavu pašreizējo toņa dziļumu | 895a1847 |  |
| phrases.nape_style.tapered | a tapered nape | kakla līnija ar taper pāreju | c170e10e |  |
| phrases.part.centre | a centre part | celiņš pa vidu | 29c5b548 |  |
| phrases.part.deep_side | a deep side part | dziļš sānu celiņš | 58840448 |  |
| phrases.part.side | a side part | celiņš sānos | f483338a |  |
| phrases.perimeter.blunt | blunt ends | taisni matu gali | f4767c2a |  |
| phrases.perimeter.rounded | a rounded outline | noapaļota griezuma līnija | 7d9c7af9 |  |
| phrases.perimeter.soft | soft ends | mīksti matu gali | b801d2ca |  |
| phrases.regions.face_frame | colour around the face | krāsa ap seju | 7bcbd5fe |  |
| phrases.sides.bald_fade | a bald fade | bald fade | 8872bff5 |  |
| phrases.sides.drop_fade | a drop fade | drop fade | 6774ec07 |  |
| phrases.sides.high_fade | a high fade | high fade | 50caacea |  |
| phrases.sides.low_fade | a low fade | low fade | 608fbee8 |  |
| phrases.sides.mid_fade | a mid fade | mid fade | eeffeee8 |  |
| phrases.sides.scissor_taper | a scissor taper | taper ar šķērēm | 030d83dd |  |
| phrases.sides.skin_fade | a skin fade | skin fade | 9a154601 |  |
| phrases.sides.taper | a taper at the sides | taper pāreja sānos | 96b3c63a |  |
| phrases.sides.undercut | an undercut | undercut | 886f54c2 |  |
| phrases.sides_width.close | close-cut sides | īsi nogriezti sāni | 6d5de9d8 |  |
| phrases.sides_width.medium | sides of medium length | vidēja garuma sāni | 60ff6192 |  |
| phrases.silhouette.bob | a bob shape | boba forma | 7f19232e |  |
| phrases.silhouette.caesar | a Caesar shape | Caesar griezuma forma | 3b35533d |  |
| phrases.silhouette.crew | a crew cut shape | crew cut forma | 92d2c0e4 |  |
| phrases.silhouette.crop | a cropped shape | crop griezuma forma | d7f1a32d |  |
| phrases.silhouette.french_crop | a French crop shape | French crop forma | 1214be0f |  |
| phrases.silhouette.lob | a long bob shape | pagarinātā boba (lob) forma | 9337b7da |  |
| phrases.silhouette.long_layers | a long layered shape | gara pakāpeniska forma | 5422af84 |  |
| phrases.silhouette.mullet | a mullet shape | mulleta forma | 5aedf0b3 |  |
| phrases.silhouette.pixie | a pixie shape | pixie forma | cafc4795 |  |
| phrases.silhouette.pompadour | a pompadour | pompadour griezums | 1556ef23 |  |
| phrases.silhouette.quiff | a quiff | quiff griezums | 115678a0 |  |
| phrases.silhouette.rounded | a rounded shape | noapaļota forma | edcccd62 |  |
| phrases.silhouette.shag | a shag shape | shag griezuma forma | a0e939d2 |  |
| phrases.silhouette.side_sweep | a side-swept shape | uz sānu veidota forma | f095d5f6 |  |
| phrases.silhouette.swept_back | a swept-back shape | atpakaļ atglausta forma | 056400b3 |  |
| phrases.silhouette.tapered_natural | a tapered natural shape | dabiski sašaurināta forma | 52c9b22f |  |
| phrases.silhouette.twist_out | defined twists or coils | izteikti tvisti vai cirtas | ed123d6d |  |
| phrases.styling_minutes.0-5 | up to 5 minutes of styling | ieveidošana līdz 5 minūtēm | 84ff47b7 |  |
| phrases.styling_minutes.0-10 | up to 10 minutes of styling | ieveidošana līdz 10 minūtēm | 9ec45bd9 |  |
| phrases.styling_minutes.0-12 | up to 12 minutes of styling | ieveidošana līdz 12 minūtēm | 26cf38f3 |  |
| phrases.styling_minutes.15-60 | a styled finish of 15 minutes or more | ieveidošana 15 minūtes vai ilgāk | 8bbf3d40 |  |
| phrases.tags.air_dry_friendly | a shape that air-dries well | griezums, kas labi izskatās, žūstot dabiski | 6387e8d7 |  |
| phrases.tags.low_maintenance | low upkeep | viegla kopšana | 0c34f91f |  |
| phrases.tags.needs_blow_out | a blow-dried finish | ar fēnu veidots sakārtojums | 908982f9 |  |
| phrases.tags.slick_back | a slicked-back finish | gludi atglausti mati | 32713e1a |  |
| phrases.tags.textured_top | a textured top | teksturēta augšdaļa | f4ddb27a |  |
| phrases.tags.wash_and_go | a wash-and-go finish | «wash-and-go» sakārtojums | 85bff166 |  |
| phrases.tags.workplace_friendly | a classic, polished look | klasisks, kopts tēls | 58e83270 |  |
| phrases.technique.all_over | all-over colour | krāsošana visā garumā | 314584f1 |  |
| phrases.technique.babylights | babylights | babylights | e3c388d5 | same |
| phrases.technique.balayage | balayage | balayage | 5fd2b70a | same |
| phrases.technique.foil_highlights | foil highlights | šķipsnas folijā | b38a508a |  |
| phrases.technique.gloss | a gloss | gloss tonēšana | e4458200 |  |
| phrases.technique.grey_blending | grey blending | sirmo matu sapludināšana | 46170a4c |  |
| phrases.technique.grey_coverage | grey coverage | sirmo matu nokrāsošana | ebdeba3d |  |
| phrases.technique.lowlights | lowlights | lowlights | 57d7e32f | same |
| phrases.technique.root_shadow | a root shadow | sakņu ēnojums (root shadow) | c33abb8f |  |
| phrases.texture_fit.good | a shape made for your hair texture | tavai matu tekstūrai piemērots griezums | 35b83acd |  |
| phrases.tie_back.true | enough length to tie back | pietiekams garums, lai saņemtu matus | ae6a7cd7 |  |
| phrases.tone.ash | ash tones | pelnu toņi | 005f00c8 |  |
| phrases.tone.beige | beige tones | bēšie toņi | aa832e16 |  |
| phrases.tone.burgundy | burgundy tones | bordo toņi | 47f35ba6 |  |
| phrases.tone.caramel | caramel tones | karameļu toņi | 8afee1d0 |  |
| phrases.tone.chestnut | chestnut tones | kastaņbrūnie toņi | cf243796 |  |
| phrases.tone.chocolate | chocolate tones | šokolādes toņi | f6271484 |  |
| phrases.tone.copper | copper tones | vara toņi | d65c474e |  |
| phrases.tone.golden | golden tones | zelta toņi | 6b092403 |  |
| phrases.tone.honey | honey tones | medus toņi | f596d3f8 |  |
| phrases.tone.plum | plum tones | plūmju toņi | 0cf37636 |  |
| phrases.tone.red_brown | red-brown tones | sarkanbrūnie toņi | d50b7d13 |  |
| phrases.tone.silver | silver tones | sudraba toņi | 37f3b378 |  |
| phrases.top_length.long | a long top | gara augšdaļa | 0042cfe6 |  |
| phrases.top_length.medium | a top of medium length | vidēja garuma augšdaļa | ac949550 |  |
| phrases.top_length.short | a short top | īsa augšdaļa | 38918382 |  |
| phrases.trim_weeks.1-6 | trims every 6 weeks or sooner | pielīdzināšana ik pēc 6 nedēļām vai biežāk | 0d6d67a9 |  |
| phrases.trim_weeks.8-26 | 8 weeks or more between trims | 8 nedēļas vai vairāk starp pielīdzināšanām | 35f9e983 |  |
| phrases.trim_weeks.10-26 | 10 weeks or more between trims | 10 nedēļas vai vairāk starp pielīdzināšanām | 5504bbba |  |
| phrases.tucked_behind_ear.true | lengths that tuck behind the ear | garums, ko var aizlikt aiz auss | e7388fb8 |  |
| phrases.upkeep_weeks.4-6 | colour visits every 4 to 6 weeks | krāsošanas vizītes ik pēc 4 līdz 6 nedēļām | 2da57e1e |  |
| phrases.upkeep_weeks.12-26 | 12 weeks or more between colour visits | 12 nedēļas vai vairāk starp krāsošanas vizītēm | 942814bd |  |
| phrases.vivid.false | a natural-looking shade | dabisks tonis | f9b0f303 |  |
| phrases.vivid.true | a bright fashion shade | košs modes tonis | 65f6bbf9 |  |
| phrases.volume_zone.crown | volume at the crown | apjoms galvvidū | b09e2e64 |  |
| phrases.volume_zone.ends | fullness at the ends | biezums matu galos | e6f4cc20 |  |
| phrases.volume_zone.jaw | movement at the jaw | kustība pie žokļa līnijas | 1d907a70 |  |
| phrases.volume_zone.occiput | fullness at the back of the head | apjoms pakausī | 17b1cff8 |  |
| phrases.volume_zone.root_lift | lift at the roots | pacēlums pie saknēm | 47b82eb7 |  |
| phrases.volume_zone.sides | width at the sides | platums sānos | b0fb3272 |  |
| phrases.volume_zone.temples | fullness at the temples | apjoms deniņos | 31afcfc3 |  |
| phrases.warmth.cool | a cool shade | vēss tonis | 1f655911 |  |
| phrases.warmth.neutral | a neutral shade | neitrāls tonis | fb739a63 |  |
| phrases.warmth.warm | a warm shade | silts tonis | 133535fb |  |
| phrases.weight_removal.high | weight taken out | noņemts smagums | 4ff55be8 |  |
| phrases.weight_removal.low | weight kept in | saglabāts smagums | c148c00f |  |
| phrases.weight_removal.medium | some weight taken out | daļēji noņemts smagums | 0efe89a3 |  |
| phrases.top_length.very_short | a very short top | ļoti īsa augšdaļa | bd78b623 |  |
| phrases.lift_levels.0-0 | colour at the depth you have now | krāsa tavā pašreizējā toņa dziļumā | 9b76d2a1 |  |
| phrases.family.blonde | a blonde shade | blonds tonis | 61ff91b7 |  |
| phrases.family.red_copper | a red or copper shade | ruds vai vara tonis | 45437379 |  |
| phrases.family.black | a black shade | melns tonis | c4f89ca6 |  |
| phrases.liked.silhouette | the same shape as one of them | tāda pati forma kā vienam no tiem | 387ca359 |  |
| phrases.liked.length_class | the same length as one of them | tāds pats garums kā vienam no tiem | 2676af73 |  |
| phrases.liked.fringe | the same fringe as one of them | tādi paši priekšmati kā vienam no tiem | 6c86cf78 |  |
| phrases.liked.height_top | the same height on top as one of them | tāds pats augstums augšdaļā kā vienam no tiem | 82ef126a |  |
| phrases.target_level.7-10 | a light finish, level 7 or lighter | gaišs rezultāts, 7. līmenis vai gaišāks | 7a070956 |  |
| phrases.lengths_darken.0-1 | colour at about the depth you have now | krāsa apmēram tavā pašreizējā toņa dziļumā | e420c9c4 |  |
| phrases.roots_from_worn.0-1 | colour at about the depth you have now | krāsa apmēram tavā pašreizējā toņa dziļumā | e420c9c4 |  |
| phrases.darkens_by.1-3 | colour a little darker than your hair now | krāsa nedaudz tumšāka par taviem matiem šobrīd | 60327927 |  |
| phrases.lightening.none | no lightener | bez balinātāja | d1cdddaf |  |
| phrases.reaches_shade.true | a shade your hair can take | tonis, ko tavos matos var iegūt | 19e37bf9 |  |
| phrases.ends_darker.true | colour that ends darker than your hair now | krāsa, kur matu gali ir tumšāki par taviem matiem šobrīd | f69ab916 |  |
| phrases.grey_effect.covers | colour that covers grey | krāsa, kas nosedz sirmos matus | 426d02a5 |  |
| phrases.grey_effect.blends | colour that blends grey in softly | krāsa, kas maigi sapludina sirmos matus | 16c24080 |  |
| phrases.grey_effect.tints | a tint that softens grey | tonējums, kas pieklusina sirmos matus | eaa17201 |  |
| phrases.grey_effect.silver | a silver finish | sudrabains tonis | 0d1f38f3 |  |
| phrases.grey_effect.shows | grey left to show | sirmie mati paliek redzami | 8de0c90e |  |
| phrases.darkens_by.4-9 | colour much darker than your hair now | krāsa daudz tumšāka par taviem matiem šobrīd | 165ecd88 |  |
| phrases.lengths_lift.-1-1 | colour at about the depth you have now | krāsa apmēram tavā pašreizējā toņa dziļumā | e420c9c4 |  |
| policy.suitability.because.trim | You said “{said}” for trims, and this cut can go about {longest} between trims. | Tu norādīji “{said}” par griezuma pielīdzināšanu, un šim griezumam starp pielīdzināšanas reizēm var būt apmēram {longest}. | 94131f4f |  |
| policy.suitability.because.styling | You said “{said}” for styling, and this cut can take as little as {fastest}. | Tu norādīji “{said}” par ieveidošanu, un šī griezuma ieveidošana var aizņemt vien {fastest}. | a38f7c1b |  |
| policy.suitability.because.density | This cut is a good match for your hair density. | Šis griezums labi atbilst tavu matu biezumam. | 9538f0a2 |  |
| policy.suitability.because.does.adds_height | adds height | piešķir augstumu | 3b36a42f |  |
| policy.suitability.because.does.keeps_top_low | keeps the top low | saglabā augšdaļu zemu | e35dc0c1 |  |
| policy.suitability.because.does.sides_close | keeps the sides close | saglabā sānus piegulošus | 69987bf6 |  |
| policy.suitability.because.does.adds_width | adds width at the sides | piešķir platumu sānos | f028a127 |  |
| policy.suitability.because.does.fringe_line | brings a soft line across the forehead | veido maigu līniju pāri pierei | 4c1cbc88 |  |
| policy.suitability.because.does.balanced | keeps an even shape around the face | saglabā vienmērīgu formu ap seju | ccfefd64 |  |
| policy.suitability.because.aim.soften | That is this app’s own styling preference for your proportions. | Tā ir šīs lietotnes stila izvēle tavām proporcijām. | ef07f2bd |  |
| policy.suitability.because.aim.between | That is this app’s own styling preference for your proportions. | Tā ir šīs lietotnes stila izvēle tavām proporcijām. | ef07f2bd |  |
| policy.suitability.because.aim.preserve | It keeps your own proportions, this app’s own styling preference. | Tas saglabā tavas proporcijas — tā ir šīs lietotnes stila izvēle. | 791fa07a |  |
| policy.suitability.because.aim.emphasise | It plays up your own proportions, this app’s own styling preference. | Tas izceļ tavas proporcijas — tā ir šīs lietotnes stila izvēle. | c6cf54fa |  |
| colour-natural-level.prompt | What colour does your hair grow at the roots, before any dye? | Kādā krāsā tev aug mati pie saknēm — pirms jebkādas krāsošanas? | e4e34694 |  |
| colour-natural-level.help | Look at new growth. Between two? Choose the darker. If you have grey, go by the darkest hair you see. These shades are a guide, not a measurement. | Paskaties uz ataugušajām saknēm. Šaubies starp diviem? Izvēlies tumšāko. Ja tev ir sirmi mati, vadies pēc tumšākajiem matiem, ko redzi. Šie toņi ir orientieris, nevis precīzs mērījums. | 89301d68 |  |
| colour-natural-level.options.1.label | Black | Melns | c6cfe6e4 |  |
| colour-natural-level.options.2.label | Very dark brown or off-black | Ļoti tumši brūns vai gandrīz melns | 62cc8b3f |  |
| colour-natural-level.options.3.label | Dark brown | Tumši brūns | f22b6895 |  |
| colour-natural-level.options.4.label | Medium brown | Vidēji brūns | 900bfc8d |  |
| colour-natural-level.options.5.label | Light brown | Gaiši brūns | d5b0c919 |  |
| colour-natural-level.options.6.label | Dark blonde | Tumši blonds | 56245391 |  |
| colour-natural-level.options.7.label | Medium blonde | Vidēji blonds | 6216a7e6 |  |
| colour-natural-level.options.8.label | Light blonde | Gaiši blonds | da61bb7d |  |
| colour-natural-level.options.9.label | Very light blonde | Ļoti gaiši blonds | 20b9278c |  |
| colour-natural-level.options.10.label | Pale or platinum natural blonde | Īpaši gaišs vai platīna dabiski blonds | a19b9122 |  |
| colour-natural-level.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| colour-current-level-lengths.prompt | How light or dark is the rest of your hair today, away from the roots? | Cik gaiši vai tumši šobrīd ir tavi mati visā garumā, neskaitot saknes? | c47c72bb |  |
| colour-current-level-lengths.help | Sun and dye can change it. Between two? Choose the darker. These shades are a guide, not a measurement. | Saule un krāsa to var mainīt. Šaubies starp diviem? Izvēlies tumšāko. Šie toņi ir orientieris, nevis precīzs mērījums. | 791c689b |  |
| colour-current-level-lengths.options.1.label | Black or very dark | Melns vai ļoti tumšs | 1a20a51a |  |
| colour-current-level-lengths.options.3.label | Dark brown to medium brown | Tumši brūns līdz vidēji brūns | 3a89490e |  |
| colour-current-level-lengths.options.5.label | Light brown to dark blonde | Gaiši brūns līdz tumši blonds | 3580d974 |  |
| colour-current-level-lengths.options.7.label | Medium to light blonde | Vidēji līdz gaiši blonds | b1528ef8 |  |
| colour-current-level-lengths.options.9.label | Very light or near white | Ļoti gaišs vai gandrīz balts | 151b3858 |  |
| colour-current-level-lengths.options.null.label | It varies a lot, or not sure | Ļoti atšķiras vai grūti pateikt | 7b6926f3 |  |
| colour-current-tone.prompt | What tone does your hair have today? | Kāds tonis taviem matiem ir šodien? | 6d585df2 |  |
| colour-current-tone.help | Think of how it looks in daylight. | Novērtē, kā tie izskatās dienasgaismā. | b660ce3f |  |
| colour-current-tone.options.warm.label | Warm, golden or yellow | Silts, zeltains vai dzeltens | beaee9e2 |  |
| colour-current-tone.options.copper.label | Orange, copper or red | Oranžs, vara vai ruds | 3aa2f51c |  |
| colour-current-tone.options.neutral.label | Neutral | Neitrāls | 1c6ac69f |  |
| colour-current-tone.options.cool.label | Cool, ash or grey | Vēss, pelnu vai pelēks | b4db0f9d |  |
| colour-current-tone.options.brassy.label | Faded or brassy | Izbalējis vai rūsagans | 73ef6cd1 |  |
| colour-current-tone.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-chemical-history.prompt | Which of these have been on your hair in the last 2-3 years, or are still in it? | Kas no šī ir bijis tavos matos pēdējo 2–3 gadu laikā vai joprojām tajos ir? | 14f75693 |  |
| hair-chemical-history.help | Tick everything that applies. Long hair can still hold colour from years ago, so count anything that has not been cut off yet. | Atzīmē visu, kas atbilst. Garos matos krāsa var saglabāties gadiem ilgi, tāpēc ņem vērā visu, kas vēl nav nogriezts. | 62089d73 |  |
| hair-chemical-history.options.none.label | Nothing, natural hair | Nekas, dabiski mati | 06c56dcd |  |
| hair-chemical-history.options.home_dye.label | Home dye or box dye, any kind | Mājas vai veikala matu krāsa (jebkāda) | f2342907 |  |
| hair-chemical-history.options.home_dark_dye.label | Home dye in black or very dark | Mājas matu krāsa melnā vai ļoti tumšā tonī | a3b81d27 |  |
| hair-chemical-history.options.salon_colour.label | Colour done at a salon | Salona matu krāsa | 24db0531 |  |
| hair-chemical-history.options.bleach.label | Bleach or lightener | Balinātājs vai gaišinātājs | 3f9d5db1 |  |
| hair-chemical-history.options.highlights.label | Highlights or balayage (lighter streaks) | Šķipsnas vai balayage (gaišākas šķipsnas) | ce276289 |  |
| hair-chemical-history.options.vivid.label | Bright colour, such as pink or blue | Koša krāsa, piemēram, rozā vai zila | e41cedf0 |  |
| hair-chemical-history.options.colour_remover.label | Colour remover, to take dye out | Krāsas noņēmējs, lai izņemtu krāsu | b24d3c59 |  |
| hair-chemical-history.options.henna_plant.label | Plant henna (red-orange powder) | Augu henna (sarkanīgi oranžs pulveris) | f2d847f5 |  |
| hair-chemical-history.options.henna_compound.label | Black or coloured henna, or a product that darkens grey | Melnā vai krāsainā henna, vai līdzeklis, kas padara sirmos matus tumšākus | fcc0f89e |  |
| hair-chemical-history.options.relaxer_perm.label | Perm, relaxer or chemical straightening | Ilgviļņi, relaxer vai ķīmiskā taisnošana | 65e41e0d |  |
| hair-chemical-history.options.keratin.label | Keratin or smoothing treatment | Keratīns vai nogludinoša procedūra | 71733850 |  |
| hair-chemical-history.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| colour-last-dye.prompt | When was your last colour or bleach? | Kad pēdējo reizi krāsoji vai balināji matus? | c26d7fff |  |
| colour-last-dye.options.weeks_0_2.label | Under 2 weeks ago | Mazāk nekā pirms 2 nedēļām | 817abac3 |  |
| colour-last-dye.options.weeks_2_8.label | 2-8 weeks ago | Pirms 2–8 nedēļām | 82f83bb0 |  |
| colour-last-dye.options.months_2_6.label | 2-6 months ago | Pirms 2–6 mēnešiem | 3d7b5e5b |  |
| colour-last-dye.options.months_6_plus.label | More than 6 months ago | Vairāk nekā pirms 6 mēnešiem | a3c5b878 |  |
| colour-last-dye.options.never.label | Never coloured | Nekad nav krāsoti | 276d8ae1 |  |
| colour-last-dye.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| colour-last-chemical-service.prompt | When did you last have a perm, relaxer, keratin or other straightening? | Kad tev pēdējo reizi bija ilgviļņi, relaxer, keratīns vai cita taisnošana? | bf5c331e |  |
| colour-last-chemical-service.options.weeks_0_2.label | Under 2 weeks ago | Mazāk nekā pirms 2 nedēļām | 817abac3 |  |
| colour-last-chemical-service.options.weeks_2_8.label | 2-8 weeks ago | Pirms 2–8 nedēļām | 82f83bb0 |  |
| colour-last-chemical-service.options.months_2_6.label | 2-6 months ago | Pirms 2–6 mēnešiem | 3d7b5e5b |  |
| colour-last-chemical-service.options.months_6_plus.label | More than 6 months ago | Vairāk nekā pirms 6 mēnešiem | a3c5b878 |  |
| colour-last-chemical-service.options.never.label | Never | Nekad | 6300ef80 |  |
| colour-last-chemical-service.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| colour-bleach-count.prompt | How many times have the lengths you have now been bleached or lightened? | Cik reižu tavs pašreizējais matu garums ir balināts vai gaišināts? | 24959b50 |  |
| colour-bleach-count.help | Count highlights and balayage too, but not hair that has since been cut off. | Ieskaiti arī šķipsnas un balayage, bet ne matus, kas kopš tā laika ir nogriezti. | 40a4bf89 |  |
| colour-bleach-count.options.0.label | Never | Nekad | 6300ef80 |  |
| colour-bleach-count.options.1.label | Once | Vienu reizi | d88f6d83 |  |
| colour-bleach-count.options.3.label | 2-3 times | 2–3 reizes | 9ddb9d26 |  |
| colour-bleach-count.options.4.label | 4 or more | 4 vai vairāk reizes | a262b91a |  |
| colour-bleach-count.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| colour-henna-type.prompt | If you used henna: what kind? | Ja lietoji hennu: kādu tieši? | 104d7f9d |  |
| colour-henna-type.help | Asked when there may be henna on your hair. A black henna tattoo has its own question. | Šo jautājam, ja tavos matos varētu būt henna. Melnās hennas tetovējumam ir atsevišķs jautājums. | 14c56fc8 |  |
| colour-henna-type.options.plant.label | Plant henna, red-orange powder | Augu henna (sarkanīgi oranžs pulveris) | d99e94e1 |  |
| colour-henna-type.options.compound.label | A coloured or "black" henna product | Krāsainās vai «melnās» hennas produkts | 8123678f |  |
| colour-henna-type.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-condition.prompt | How is your hair feeling at the moment? | Kā šobrīd jūtas tavi mati? | d2d439e7 |  |
| hair-condition.help | Damaged means it breaks or snaps easily, feels gummy or stretchy when wet, or colour will not hold. Dry means rough, straw-like or with lots of split ends. | Bojāti nozīmē, ka tie viegli lūst, mitri kļūst gumijaini vai stiepjas, vai arī tajos neturas krāsa. Sausi nozīmē, ka tie ir raupji, kā salmi vai ar daudziem šķeltiem galiem. | dade9990 |  |
| hair-condition.options.healthy.label | Healthy, it behaves well | Veselīgi, viegli savaldāmi | e5dc75d7 |  |
| hair-condition.options.dry.label | Dry, rough or with split ends | Sausi, raupji vai ar šķeltiem galiem | 4736b0ac |  |
| hair-condition.options.damaged.label | Damaged: breaks, feels gummy or will not hold colour | Bojāti: lūst, kļūst gumijaini vai netur krāsu | 1cddc9eb |  |
| hair-condition.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-texture.prompt | How does your hair dry if you leave it alone? | Kādi ir tavi mati, ja ļauj tiem izžūt pašiem? | f086a966 |  |
| hair-texture.help | Let it dry with no products. Go by most of your hair. Straight falls flat, wavy bends in loose S shapes, curly makes loops, coily makes tight zigzags or tiny coils. | Ļauj tiem izžūt bez matu veidošanas līdzekļiem. Vadies pēc lielākās matu daļas. Taisni mati krīt gludi, viļņaini veido brīvus S veida viļņus, cirtaini veido lokas, bet sīki cirtaini — ciešus zigzagus vai sīkas spirālītes. | 83626dc2 |  |
| hair-texture.options.straight.label | Straight | Taisni | dc81306b |  |
| hair-texture.options.wavy.label | Wavy | Viļņaini | 0d99011d |  |
| hair-texture.options.curly.label | Curly | Cirtaini | 71142c83 |  |
| hair-texture.options.coily.label | Coily | Sīki cirtaini | d73b49a2 |  |
| hair-texture.options.mixed.label | A mix | Jaukti | 4d4ecb91 |  |
| hair-texture.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-strand.prompt | How thick are your individual strands? | Cik biezs ir atsevišķs mats? | 482e0d6d |  |
| hair-strand.help | Roll one hair between your fingers: fine is hard to feel, coarse feels like thread. | Pavirpini vienu matu starp pirkstiem: smalku matu ir grūti sajust, bet rupjš šķiet kā diegs. | 411adf14 |  |
| hair-strand.options.fine.label | Fine | Smalki | fa67303a |  |
| hair-strand.options.medium.label | Medium | Vidēji | 8e588cd1 |  |
| hair-strand.options.coarse.label | Coarse | Rupji | 435d518a |  |
| hair-strand.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| grey-amount.prompt | How much grey or white hair do you have, roughly? | Cik daudz sirmu vai baltu matu tev aptuveni ir? | a7e85dce |  |
| grey-amount.help | Roots and all over combined. | Pie saknēm un visā garumā kopā. | a4a7840a |  |
| grey-amount.options.0.label | None | Nav | dc937b59 |  |
| grey-amount.options.5.label | A few strands, up to about 10% | Dažas šķipsnas, līdz aptuveni 10% | a4214527 |  |
| grey-amount.options.20.label | Some, about 10-30% | Nedaudz, apmēram 10–30% | 70006695 |  |
| grey-amount.options.40.label | A fair amount, about 30-50% | Diezgan daudz, apmēram 30–50% | 877f6659 |  |
| grey-amount.options.62.5.label | Mostly grey, about 50-75% | Pārsvarā sirmi, apmēram 50–75% | 0ee993b1 |  |
| grey-amount.options.87.5.label | Almost all grey or white | Gandrīz pilnībā sirmi vai balti | a9829361 |  |
| grey-amount.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| colour-grey-goal.prompt | What would you like to do about grey? | Ko tu vēlētos darīt ar sirmumu? | efa1108b |  |
| colour-grey-goal.options.cover.label | Cover it fully | Nosegt pilnībā | 521495e8 |  |
| colour-grey-goal.options.blend.label | Blend it softly | Maigi sapludināt | 571ebc4c |  |
| colour-grey-goal.options.embrace.label | Show it, make it look intentional | Izcelt, lai izskatās pārdomāti | 53321eb9 |  |
| colour-grey-goal.options.silver.label | Move to silver or white | Pāriet uz sudraba vai baltu toni | 9bae101a |  |
| colour-grey-goal.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| colour-grey-texture.prompt | Does your grey feel different from the rest of your hair? | Vai sirmie mati pēc sajūtas atšķiras no pārējiem? | 9584bd72 |  |
| colour-grey-texture.options.same.label | Same as the rest | Tādi paši kā pārējie | cf62d35e |  |
| colour-grey-texture.options.wiry.label | Wirier or coarser | Rupjāki vai cietāki | 11a04fec |  |
| colour-grey-texture.options.dry.label | Drier or frizzier | Sausāki vai pūkaināki | 4cafa404 |  |
| colour-grey-texture.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| look-skin-depth.prompt | How would you describe your skin depth? | Kā tu raksturotu savu ādas toni? | 84300cc1 |  |
| look-skin-depth.help | Choose the closest. There is no right or wrong answer. | Izvēlies tuvāko variantu. Te nav pareizu vai nepareizu atbilžu. | c60ce342 |  |
| look-skin-depth.options.very_light.label | Very light | Ļoti gaišs | 9418752b |  |
| look-skin-depth.options.light.label | Light | Gaišs | dbcd5e7b |  |
| look-skin-depth.options.medium.label | Medium | Vidējs | 8e588cd1 |  |
| look-skin-depth.options.tan_olive.label | Tan or olive | Iedeguma vai olīvu | 2eb16966 |  |
| look-skin-depth.options.deep.label | Deep | Tumšs | c54e3625 |  |
| look-skin-depth.options.very_deep.label | Very deep | Ļoti tumšs | c90c12c7 |  |
| look-skin-depth.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| look-undertone.prompt | Does your skin lean warm, cool or neutral? | Vai tavai ādai ir drīzāk silts, vēss vai neitrāls apakštonis? | c11ecf71 |  |
| look-undertone.help | Rough clues: gold jewellery tends to suit warm skin and silver cool skin. Veins on the inner wrist look greener on warm skin and bluer on cool skin. Skin that tans easily often leans warm. Your own answer is what we use. | Aptuvenas norādes: zelta rotaslietas parasti labāk piestāv siltai ādai, bet sudrabs — vēsai. Vēnas plaukstas locītavas iekšpusē siltai ādai izskatās zaļganākas, bet vēsai — zilganākas. Āda, kas viegli iedeg, bieži vien ir ar siltu apakštoni. Mēs vadīsimies pēc tavas atbildes. | 833bd94d |  |
| look-undertone.options.warm.label | Warm | Silts | 316f2428 |  |
| look-undertone.options.cool.label | Cool | Vēss | 0b0fd31e |  |
| look-undertone.options.neutral.label | Neutral | Neitrāls | 1c6ac69f |  |
| look-undertone.options.olive.label | Olive | Olīvu | 3038ab33 |  |
| look-undertone.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| look-eye-colour.prompt | What is your eye colour? | Kāda ir tava acu krāsa? | 5e38d36b |  |
| look-eye-colour.options.dark_brown.label | Dark brown | Tumši brūna | f22b6895 |  |
| look-eye-colour.options.light_brown.label | Light brown or amber | Gaiši brūna vai dzintara | 91baf641 |  |
| look-eye-colour.options.hazel.label | Hazel | Riekstbrūna | d996414c |  |
| look-eye-colour.options.green.label | Green | Zaļa | d486dfbd |  |
| look-eye-colour.options.blue.label | Blue | Zila | ec7d56a0 |  |
| look-eye-colour.options.grey.label | Grey | Pelēka | d4ac5809 |  |
| look-eye-colour.options.other.label | Other or it varies | Cita vai mēdz mainīties | a3470a62 |  |
| look-eye-colour.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| pref-colour-direction.prompt | What would you like your colour to do? | Ko tu vēlētos panākt ar matu krāsu? | 0c5a0d0b |  |
| pref-colour-direction.options.lighter.label | Go lighter | Padarīt gaišākus | 416773c4 |  |
| pref-colour-direction.options.darker.label | Go darker | Padarīt tumšākus | 1658ccbd |  |
| pref-colour-direction.options.tone.label | Same depth, warmer or cooler | To pašu gaišumu, bet siltāku vai vēsāku toni | c54aadbb |  |
| pref-colour-direction.options.refresh.label | Refresh what I have | Atsvaidzināt esošo krāsu | 1e48d826 |  |
| pref-colour-direction.options.grey.label | Cover or blend my grey | Nosegt vai sapludināt sirmumu | d252f87f |  |
| pref-colour-direction.options.vivid.label | Try a bright colour | Izmēģināt košu toni | 28fc11ff |  |
| pref-colour-direction.options.natural.label | Go back to my natural colour | Atgriezties pie dabīgās matu krāsas | b0c74741 |  |
| pref-colour-direction.options.null.label | Not sure, show me ideas | Grūti pateikt, parādi idejas | 3a28133a |  |
| colour-wanted.prompt | Which is closest to what you have in mind? | Kurš tonis ir vistuvāk tavai iecerei? | 15343c8d |  |
| colour-wanted.help | Tap one or two. | Atzīmē vienu vai divus. | dc300bf1 |  |
| colour-wanted.options.blonde.label | Blonde | Blonds | 4495c74f |  |
| colour-wanted.options.brunette.label | Brown | Brūns | 18f28559 |  |
| colour-wanted.options.red_copper.label | Red or copper | Rudie vai vara toņi | 2010860b |  |
| colour-wanted.options.red_copper.note.barbering | We have no men's looks in this colour yet. | Šajā krāsā mums pagaidām vēl nav vīriešu tēlu. | 475fc6a2 |  |
| colour-wanted.options.black.label | Black | Melns | c6cfe6e4 |  |
| colour-wanted.options.grey_silver.label | Grey or silver | Pelēkie vai sudraba toņi | 1e942de3 |  |
| colour-wanted.options.null.label | Any, or not sure | Jebkurš tonis vai grūti pateikt | d69ca6fb |  |
| pref-change-amount.prompt | How different do you want to look? | Cik lielas pārmaiņas tu vēlies? | bbaedae9 |  |
| pref-change-amount.options.subtle.label | Much the same, just fresher | Gandrīz tāpat, tikai svaigāk | 06e01571 |  |
| pref-change-amount.options.noticeable.label | Clearly different, still easy to wear | Pamanāmas, bet ikdienā ērtas pārmaiņas | 2e269681 |  |
| pref-change-amount.options.bold.label | A big change | Lielas pārmaiņas | d4fed540 |  |
| pref-change-amount.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| pref-colour-upkeep.prompt | How often are you willing to visit a salon for colour? | Cik bieži tu būtu ar mieru apmeklēt salonu, lai krāsotu matus? | dd266368 |  |
| pref-colour-upkeep.options.high.label | Every 6 weeks or more often | Reizi 6 nedēļās vai biežāk | 52719483 |  |
| pref-colour-upkeep.options.medium.label | Every 7-11 weeks | Reizi 7–11 nedēļās | b259b6c2 |  |
| pref-colour-upkeep.options.low.label | Every 3 months or less often | Reizi 3 mēnešos vai retāk | 1d18e9b2 |  |
| pref-colour-upkeep.options.home_only.label | I would rather do it at home | Labāk to darītu mājās | 758e9805 |  |
| pref-colour-upkeep.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| pref-budget.prompt | What budget per visit feels right? | Kāds budžets par vienu apmeklējumu tev šķiet piemērots? | 46e4bf50 |  |
| pref-budget.help | Compared with what you usually spend on a visit. | Salīdzinot ar to, cik parasti tērē par apmeklējumu. | cdfb6bbb |  |
| pref-budget.options.low.label | Keep it low | Pēc iespējas mazāks | f9c3620d |  |
| pref-budget.options.medium.label | Medium | Vidējs | 8e588cd1 |  |
| pref-budget.options.high.label | Happy to invest | Labprāt ieguldu | 29afbd7f |  |
| pref-budget.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| dye-reaction.prompt | Has hair dye or a black henna tattoo ever made your skin react? And is your scalp sore now? | Vai matu krāsa vai melnās hennas tetovējums tev kādreiz ir izraisījis ādas reakciju? Un vai galvas āda šobrīd ir sāpīga? | 9dc159cd | safety; checked |
| dye-reaction.help | Redness, a rash, itching, swelling, blisters or trouble breathing are all reactions. | Apsārtums, izsitumi, nieze, pietūkums, pūslīši vai apgrūtināta elpošana — tās visas ir reakcijas. | 81f0a6b8 | safety; checked |
| dye-reaction.options.safety.dye_reaction=none,safety.scalp_irritation=none.label | No reaction, and my scalp is fine | Reakcijas nav bijis, un ar galvas ādu viss ir kārtībā | aadd0d9d | safety; checked |
| dye-reaction.options.safety.dye_reaction=none,safety.scalp_irritation=now.label | No reaction, but my scalp is sore, itchy, sunburnt or broken now | Reakcijas nav bijis, bet galvas āda šobrīd ir sāpīga, niezoša, saulē apdegusi vai bojāta | 77810dd9 | safety; checked |
| dye-reaction.options.safety.dye_reaction=mild.label | Yes, a mild reaction | Jā, viegla reakcija | 75f28c51 | safety; checked |
| dye-reaction.options.safety.dye_reaction=serious.label | Yes, a serious reaction | Jā, nopietna reakcija | bb4e214b | safety; checked |
| dye-reaction.options.null.label | Not sure | Neesmu pārliecināts | dca5fa43 | safety; checked |
| henna-tattoo.prompt | Have you ever had a black henna tattoo? | Vai tev kādreiz ir bijis melnās hennas tetovējums? | c46038bd | safety; checked |
| henna-tattoo.help | A black henna tattoo is a painted tattoo that fades in a few weeks. It can make a reaction to hair dye more likely. | Melnās hennas tetovējums ir uz ādas zīmēts tetovējums, kas izbalē dažu nedēļu laikā. Tas var palielināt reakcijas risku pret matu krāsu. | 3f0094c8 | safety; checked |
| henna-tattoo.options.true.label | Yes | Jā | 85a39ab3 | safety; checked |
| henna-tattoo.options.false.label | No | Nē | 1ea442a1 | safety; checked |
| henna-tattoo.options.null.label | Not sure | Neesmu pārliecināts | dca5fa43 | safety; checked |
| safety-health-context.prompt | Is any of this true right now: pregnant, breastfeeding or medical treatment? | Vai kaut kas no šī šobrīd attiecas uz tevi: grūtniecība, bērna zīdīšana vai medicīniska ārstēšana? | f0b42f76 | safety; checked |
| safety-health-context.help | You can skip this. We don't give medical advice. | Šo jautājumu vari izlaist. Mēs nesniedzam medicīniskas konsultācijas. | 4e83cfe5 | safety; checked |
| safety-health-context.options.false.label | None of these | Nekas no minētā | 161f67ca | safety; checked |
| safety-health-context.options.true.label | One or more apply | Attiecas viens vai vairāki | efd7a11c | safety; checked |
| safety-health-context.options.null.label | Skip | Izlaist | 28d03596 | safety; checked |
| hair-current-length.prompt | How far does your hair reach when you gently pull it straight? | Līdz kurienei sniedzas tavi mati, ja tos viegli izstiepj taisnus? | 6d7ba173 |  |
| hair-current-length.help | Go by the longest part. Curls count stretched out. | Vadies pēc garākās daļas. Cirtas mēri izstieptas. | 474aed9d |  |
| hair-current-length.options.very_short.label | A few centimetres | Daži centimetri | 44ee3e08 |  |
| hair-current-length.options.short.label | Above my chin | Virs zoda | 1fcc50ff |  |
| hair-current-length.options.chin.label | To my chin | Līdz zodam | 0b0ff350 |  |
| hair-current-length.options.shoulder.label | To my shoulders | Līdz pleciem | fb123dd3 |  |
| hair-current-length.options.long.label | Past my shoulders | Pāri pleciem | 1e5cf3e4 |  |
| hair-current-length.options.very_long.label | Halfway down my back or longer | Līdz muguras vidum vai garāki | 32d8673f |  |
| hair-current-length.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-resting-length.prompt | Now where does it sit when it is dry and you leave it alone? | Un līdz kurienei tie sniedzas, kad ir sausi un brīvi krīt? | d93a6ee6 |  |
| hair-resting-length.help | Curls spring up, so this is often shorter. Don't pull it. | Cirtas saraujas, tāpēc mati bieži ir īsāki. Nestiep tos. | fbbf378b |  |
| hair-resting-length.options.very_short.label | A few centimetres | Daži centimetri | 44ee3e08 |  |
| hair-resting-length.options.short.label | Above my chin | Virs zoda | 1fcc50ff |  |
| hair-resting-length.options.chin.label | To my chin | Līdz zodam | 0b0ff350 |  |
| hair-resting-length.options.shoulder.label | To my shoulders | Līdz pleciem | fb123dd3 |  |
| hair-resting-length.options.long.label | Past my shoulders | Pāri pleciem | 1e5cf3e4 |  |
| hair-resting-length.options.very_long.label | Halfway down my back or longer | Līdz muguras vidum vai garāki | 32d8673f |  |
| hair-resting-length.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| taste-cuts.prompt | Tap the looks you like. | Atzīmē tēlus, kas tev patīk. | 70d7c321 |  |
| taste-cuts.help | Pick up to 3, or none. Don't worry about whether they would suit you. | Izvēlies līdz 3 variantiem vai nevienu. Neuztraucies par to, vai tie tev piestāvētu. | e71b9b2a |  |
| taste-cuts.options.classic-pixie.label | Classic pixie | Klasiskais pixie | ff1e11d5 |  |
| taste-cuts.options.french-bob.label | French bob | Franču bobs | 32c47741 |  |
| taste-cuts.options.collarbone-lob-blunt.label | Blunt collarbone lob | Taisns lobs līdz atslēgas kaulam | 3e253bf9 |  |
| taste-cuts.options.classic-shag.label | Classic 70s shag | Klasiskais 70. gadu shag | 10f9adac |  |
| taste-cuts.options.long-u-layers.label | Long U-shape layers | Garais U veida pakāpeniskais griezums | f04a210c |  |
| taste-cuts.options.long-wolf-cut.label | Long wolf cut | Garais wolf cut | aeb5c767 |  |
| taste-cuts.options.tapered-twa.label | Tapered TWA | Tapered TWA | 5c40a364 | same |
| taste-cuts.options.shaped-round-afro.label | Shaped round afro | Noapaļots afro | 7c97b538 |  |
| taste-cuts.options.curly-bob-rounded.label | Rounded curly bob | Noapaļots cirtains bobs | 1c13330b |  |
| taste-cuts.options.curly-lob-rounded.label | Rounded curly lob | Noapaļots cirtainais lobs | 493f4c88 |  |
| taste-cuts.options.curly-long-shag.label | Curly long shag | Garais cirtainais shag | 413b2d6b |  |
| taste-cuts.options.long-curly-wolf-cut.label | Long curly wolf cut | Garais cirtainais wolf cut | 79c630c5 |  |
| taste-cuts.options.buzz-tapered.label | Tapered buzz cut | Buzz cut ar taper pāreju | bfb826cf |  |
| taste-cuts.options.textured-crop-low-taper.label | Textured crop with low taper | Teksturēts crop ar zemu taper pāreju | 45630d51 |  |
| taste-cuts.options.side-part-classic.label | Classic side part | Klasiskais sānu celiņš | 7b6e22a9 |  |
| taste-cuts.options.quiff-classic.label | Classic quiff | Klasiskais quiff | 84f7548b |  |
| taste-cuts.options.flow-medium.label | Medium flow | Vidēja garuma flow | 4383f745 |  |
| taste-cuts.options.curtains-middle-part.label | Curtains (middle part) | Curtains (ar celiņu vidū) | 19b372f5 |  |
| taste-cuts.options.curly-taper-defined.label | Taper with defined curls | Taper ar izteiktām cirtām | 287210a5 |  |
| taste-cuts.options.afro-taper-round.label | Rounded afro with taper | Noapaļots afro ar taper pāreju | 4b6875d8 |  |
| taste-cuts.options.curly-quiff.label | Curly quiff | Cirtainais quiff | 2935756a |  |
| taste-cuts.options.short-twists-fade.label | Short twists with fade | Īsi twists ar fade | 2840d54d |  |
| taste-cuts.options.curly-flow.label | Curly flow | Cirtainais flow | f47f81d3 |  |
| taste-cuts.options.waves-360.label | 360 waves | 360 waves | eed7b0d3 | same |
| taste-cuts.options.null.label | None of these, or not sure | Neviens no šiem vai grūti pateikt | f8230d2c |  |
| hair-density.prompt | How much hair do you have? | Cik biezi ir tavi mati? | 490ea0f0 |  |
| hair-density.help | Part your hair or pull it back in good light: if the scalp shows easily, choose less hair. If your hair is very short, think of how thick it grows when longer. | Pašķir matus vai saņem tos atpakaļ labā apgaismojumā: ja galvas āda viegli spīd cauri, izvēlies «Mazāk matu». Ja tev ir ļoti īsi mati, padomā, cik biezi tie ir, kad paaugas garāki. | 2ac2f10c |  |
| hair-density.options.low.label | Less hair, the scalp shows easily | Mazāk matu, galvas āda viegli spīd cauri | b69df896 |  |
| hair-density.options.medium.label | In between | Vidēji daudz | 0d06c88d |  |
| hair-density.options.high.label | A lot of hair | Daudz matu | 81022d5c |  |
| hair-density.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| styling-time.prompt | How long do you want to spend on your hair each day? | Cik daudz laika dienā vēlies veltīt matiem? | 479fd84e |  |
| styling-time.options.life.styling_minutes=7.label | Wash and go, about 5 minutes | Izmazgā un ej, apmēram 5 minūtes | b13a1e97 |  |
| styling-time.options.life.styling_minutes=12.label | About 10 minutes | Apmēram 10 minūtes | cb4da481 |  |
| styling-time.options.life.styling_minutes=20.label | Up to 20 minutes | Līdz 20 minūtēm | d91ee2c9 |  |
| styling-time.options.life.styling_minutes=60,life.enjoys_styling=true.label | I enjoy styling, as long as it takes | Man patīk veidot matus – cik vien ilgi vajag | 5cedd97b |  |
| styling-time.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| trim-interval.prompt | How often do you want a cut or a trim? | Cik bieži vēlies apgriezt vai pielīdzināt matus? | a9cd6920 |  |
| trim-interval.options.2.label | Every 2 to 4 weeks | Ik pēc 2 līdz 4 nedēļām | 5668e4cb |  |
| trim-interval.options.4.label | Every 4 to 6 weeks | Ik pēc 4 līdz 6 nedēļām | 6f4e8bc2 |  |
| trim-interval.options.6.label | Every 6 to 8 weeks | Ik pēc 6 līdz 8 nedēļām | 09fb1931 |  |
| trim-interval.options.12.label | About every 3 months | Apmēram reizi 3 mēnešos | 77972cc4 |  |
| trim-interval.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| pref-fringe.prompt | Would you like a fringe? | Vai vēlies priekšmatus? | 340fef4e |  |
| pref-fringe.options.want.label | Yes, I would like one | Jā, vēlos | faff8b68 |  |
| pref-fringe.options.open.label | Maybe, show me some | Varbūt, parādi variantus | 80cdceea |  |
| pref-fringe.options.avoid.label | No fringe, please | Nē, bez priekšmatiem | 984c9157 |  |
| pref-fringe.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| pref-fringe.help | A fringe (bangs) is hair cut to fall over your forehead. | Priekšmati (čolka) ir mati, kas nogriezti tā, lai kristu pāri pierei. | f2e2339c |  |
| pref-top-length.prompt | How long would you like the hair on top? | Cik garus matus vēlies augšpusē? | e062f390 |  |
| pref-top-length.options.very_short.label | Very short, clipper length | Ļoti īsus, mašīnītes garumā | 6b0c1293 |  |
| pref-top-length.options.short.label | Short, up to about 5 cm | Īsi, līdz aptuveni 5 cm | 192455e5 |  |
| pref-top-length.options.medium.label | Medium, about 5-10 cm | Vidēji, aptuveni 5–10 cm | b89485a2 |  |
| pref-top-length.options.long.label | Long, over 10 cm | Gari, virs 10 cm | a3be2d6e |  |
| pref-top-length.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| pref-top-length.help | A finger is about 7 cm long. | Pirksts ir aptuveni 7 cm garš. | bdb428a5 |  |
| pref-hard-lineup.prompt | Would you like a sharp line-up at the front? | Vai vēlies precīzu line-up priekšpusē? | 06fd500e |  |
| pref-hard-lineup.help | A line-up is a crisp, squared edge cut along the hairline. | Line-up ir precīza, taisni iezīmēta mala gar matu augšanas līniju. | f24c9c99 |  |
| pref-hard-lineup.options.true.label | Yes | Jā | 85a39ab3 |  |
| pref-hard-lineup.options.false.label | No | Nē | 1ea442a1 |  |
| pref-hard-lineup.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| look-glasses.prompt | Do you wear glasses? | Vai tu nēsā brilles? | e1cdd57f |  |
| look-glasses.options.none.label | No | Nē | 1ea442a1 |  |
| look-glasses.options.sometimes.label | Sometimes | Reizēm | 5bca0e3d |  |
| look-glasses.options.daily.label | Every day | Katru dienu | c4e42b97 |  |
| look-glasses.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| look-glasses-frame.prompt | What kind of frames do you wear most? | Kādus briļļu ietvarus tu nēsā visbiežāk? | 68279d44 |  |
| look-glasses-frame.options.bold.label | Bold or thick frames | Izteiksmīgus vai biezus ietvarus | cb19914c |  |
| look-glasses-frame.options.thin.label | Thin or half-rim frames | Plānus ietvarus vai pusietvarus | ac5224ef |  |
| look-glasses-frame.options.rimless.label | Rimless | Bez ietvara | 16eda6fa |  |
| look-glasses-frame.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| beard-style.prompt | What facial hair do you have now? | Kāds sejas apmatojums tev ir šobrīd? | af89cd14 |  |
| beard-style.options.none.label | Clean shaven, or only a moustache or goatee | Gludi skūta seja vai tikai ūsas vai kazbārdiņa | 084f7f7e |  |
| beard-style.options.stubble.label | Stubble | Rugāji | 3e53231b |  |
| beard-style.options.short.label | A short beard | Īsa bārda | 27923b1c |  |
| beard-style.options.medium.label | A medium beard | Vidēji gara bārda | 93e345c8 |  |
| beard-style.options.full.label | A full beard | Pilna bārda | a483e321 |  |
| beard-style.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| beard-density.prompt | How does your beard grow? | Kā aug tava bārda? | a48fd768 |  |
| beard-density.options.even.label | Evenly | Vienmērīgi | 83f7985d |  |
| beard-density.options.patchy.label | With gaps or patches | Ar tukšumiem vai retākām vietām | 3c8f89b8 |  |
| beard-density.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| beard-texture.prompt | What is your beard hair like? | Kādi ir tavas bārdas mati? | b7d94aee |  |
| beard-texture.options.straight.label | Straight | Taisni | dc81306b |  |
| beard-texture.options.wavy.label | Wavy | Viļņaini | 0d99011d |  |
| beard-texture.options.curly.label | Curly | Cirtaini | 71142c83 |  |
| beard-texture.options.coily.label | Tightly coiled | Sīki cirtaini | 4ea026fb |  |
| beard-texture.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| beard-shave-close.prompt | Do you like a very close shave on the cheeks or neck? | Vai tev patīk ļoti gluds skuvums uz vaigiem vai kakla? | ea5da4fe |  |
| beard-shave-close.options.true.label | Yes | Jā | 85a39ab3 |  |
| beard-shave-close.options.false.label | No | Nē | 1ea442a1 |  |
| beard-shave-close.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| head-occiput.prompt | What is the back of your head like? | Kāds ir tavs pakausis? | b3c4d7ed |  |
| head-occiput.help | Feel the back of your head above the neck, or ask someone to look from the side. | Aptausti pakausi virs kakla vai palūdz kādam paskatīties no sāniem. | d6d78637 |  |
| head-occiput.options.flat.label | Fairly flat | Diezgan plakans | 20061189 |  |
| head-occiput.options.rounded.label | Gently rounded | Viegli noapaļots | 009bd48a |  |
| head-occiput.options.prominent.label | Clearly rounded out | Izteikti noapaļots | 87b41696 |  |
| head-occiput.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| head-crown-shape.prompt | Is the top of your head flat or rounded? | Vai galvas augšdaļa ir plakana vai noapaļota? | cb27c6cb |  |
| head-crown-shape.options.flat.label | Fairly flat | Diezgan plakana | 20061189 |  |
| head-crown-shape.options.rounded.label | Rounded | Noapaļota | 0a62cd80 |  |
| head-crown-shape.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-cowlick-front.prompt | Does the hair at your front hairline grow in a swirl or stand up on its own? | Vai mati pie priekšējās matu augšanas līnijas aug virpulī vai paši ceļas uz augšu? | 9894e6fa |  |
| hair-cowlick-front.options.true.label | Yes | Jā | 85a39ab3 |  |
| hair-cowlick-front.options.false.label | No | Nē | 1ea442a1 |  |
| hair-cowlick-front.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-cowlick-nape.prompt | Does the hair at the nape of your neck grow upwards or to one side? | Vai mati skaustā aug uz augšu vai uz vienu pusi? | a93d9f8c |  |
| hair-cowlick-nape.help | Feel it with your fingers, or ask someone to look. | Aptausti ar pirkstiem vai palūdz kādam paskatīties. | 382b7959 |  |
| hair-cowlick-nape.options.true.label | Yes | Jā | 85a39ab3 |  |
| hair-cowlick-nape.options.false.label | No | Nē | 1ea442a1 |  |
| hair-cowlick-nape.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-crown-whorl.prompt | How does the hair grow at your crown? | Kā mati aug galvvidū? | 240ab906 |  |
| hair-crown-whorl.help | Use a photo from above, or ask someone to look. | Nofotografē no augšas vai palūdz kādam paskatīties. | 63718608 |  |
| hair-crown-whorl.options.none.label | No clear swirl | Nav izteikta virpuļa | 9f6941f2 |  |
| hair-crown-whorl.options.single.label | One swirl | Viens virpulis | bf2091cc |  |
| hair-crown-whorl.options.double.label | Two swirls | Divi virpuļi | 744d3695 |  |
| hair-crown-whorl.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-part-side.prompt | Where does your hair part on its own? | Kur mati dabiski veido celiņu? | 88a021c0 |  |
| hair-part-side.options.left.label | On the left | Kreisajā pusē | 3cf221b7 |  |
| hair-part-side.options.right.label | On the right | Labajā pusē | 411cdb2b |  |
| hair-part-side.options.centre.label | In the centre | Pa vidu | 423034a0 |  |
| hair-part-side.options.none.label | It does not part | Celiņš neveidojas | 914e2b10 |  |
| hair-part-side.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-hairline-shape.prompt | Which drawing is closest to your front hairline? | Kurš zīmējums vislabāk atbilst tavai priekšējai matu augšanas līnijai? | 554f6073 |  |
| hair-hairline-shape.options.straight.label | Straight across | Taisna | 553ff248 |  |
| hair-hairline-shape.options.rounded.label | Rounded | Noapaļota | 0a62cd80 |  |
| hair-hairline-shape.options.widows_peak.label | A point in the middle | Ar smaili vidū | 3a051ca7 |  |
| hair-hairline-shape.options.m_shape.label | Higher at the temples | Augstāka deniņos | b53c378d |  |
| hair-hairline-shape.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-recession-stage.prompt | Which drawing is closest to your hairline and crown? | Kurš zīmējums vislabāk atbilst tavai matu augšanas līnijai un galvvidum? | 334eeea3 |  |
| hair-recession-stage.help | Look straight into a mirror, or use a photo from above. | Paskaties taisni spogulī vai izmanto fotoattēlu no augšas. | a0b08ad0 |  |
| hair-recession-stage.options.1.label | Full hairline | Pilna matu augšanas līnija | 42bce2c5 |  |
| hair-recession-stage.options.2.label | A little higher at the temples | Nedaudz augstāka deniņos | 8772e661 |  |
| hair-recession-stage.options.3.label | Clearly higher at the temples | Izteikti augstāka deniņos | 75cb0ddd |  |
| hair-recession-stage.options.4.label | Higher at the temples, a small thin patch on the crown | Augstāka deniņos, neliels plānāks laukums galvvidū | b5d72f6f |  |
| hair-recession-stage.options.5.label | Higher at the temples, a larger thin patch on the crown | Augstāka deniņos, lielāks plānāks laukums galvvidū | be9e08c0 |  |
| hair-recession-stage.options.6.label | Bare on top, hair around the sides and back | Galvas virsa kaila, mati sānos un aizmugurē | 1544211f |  |
| hair-recession-stage.options.7.label | A narrow band of hair around the sides and back | Šaura matu josla sānos un aizmugurē | 1e31226b |  |
| hair-recession-stage.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| wish-hairline.prompt | Would you like your hairline to show less? | Vai vēlies, lai matu augšanas līnija būtu mazāk pamanāma? | dbcf71de |  |
| wish-hairline.options.soften.label | Yes, show it less | Jā, lai ir mazāk pamanāma | 43029d84 |  |
| wish-hairline.options.emphasise.label | No, I am happy to show it | Nē, lai droši redzama | 4f4e6fe1 |  |
| wish-hairline.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-thinning-stage.prompt | Which drawing is closest to your parting from above? | Kurš zīmējums vislabāk atbilst tavam matu celiņam no augšas? | ca40663d |  |
| hair-thinning-stage.help | Use a photo of the top of your head taken from above. | Izmanto galvas virsas fotoattēlu no augšas. | 2f2e3065 |  |
| hair-thinning-stage.options.1.label | Narrow parting | Šaurs celiņš | 541da4aa |  |
| hair-thinning-stage.options.2.label | Wider parting | Platāks celiņš | c7485e8e |  |
| hair-thinning-stage.options.3.label | Wide parting, more scalp shows | Plats celiņš, vairāk redzama galvas āda | f3295bb4 |  |
| hair-thinning-stage.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-thinning-zone.prompt | Is your hair thinner anywhere? | Vai mati kaut kur ir plānāki? | 0f4ca338 |  |
| hair-thinning-zone.options.none.label | No | Nē | 1ea442a1 |  |
| hair-thinning-zone.options.crown.label | At the crown | Galvvidū | f4a78f97 |  |
| hair-thinning-zone.options.front.label | At the front | Priekšpusē | 9c180d88 |  |
| hair-thinning-zone.options.part.label | Along the parting | Gar celiņu | 549ec503 |  |
| hair-thinning-zone.options.diffuse.label | All over | Pa visu galvu | ba8ab60f |  |
| hair-thinning-zone.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-traction-signs.prompt | Is your hairline sore, or thinner where tight styles pull? | Vai matu augšanas līnija ir sāpīga vai kļuvusi plānāka vietās, kur ciešas frizūras nostiepj matus? | 095be6f4 | safety; checked |
| hair-traction-signs.options.true.label | Yes | Jā | 85a39ab3 |  |
| hair-traction-signs.options.false.label | No | Nē | 1ea442a1 |  |
| hair-traction-signs.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-sudden-loss.prompt | Have you lost hair suddenly or in patches? | Vai mati ir izkrituši pēkšņi vai laukumos? | fea1a40f |  |
| hair-sudden-loss.options.true.label | Yes | Jā | 85a39ab3 |  |
| hair-sudden-loss.options.false.label | No | Nē | 1ea442a1 |  |
| hair-sudden-loss.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-heat-habit.prompt | How often do you use heat to style your hair? | Cik bieži tu ieveido matus ar karstumu? | d1c9a819 |  |
| hair-heat-habit.help | Hair dryers on high, straighteners and curling tongs all count. | Tas ietver gan fēnu karstā režīmā, gan taisnotāju un lokšķēres. | 3018cdb6 |  |
| hair-heat-habit.options.none.label | Never | Nekad | 6300ef80 |  |
| hair-heat-habit.options.rare.label | Now and then | Šad un tad | b1d6a50d |  |
| hair-heat-habit.options.weekly.label | Most weeks | Gandrīz katru nedēļu | 4c309043 |  |
| hair-heat-habit.options.daily.label | Every day | Katru dienu | c4e42b97 |  |
| hair-heat-habit.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| hair-style-interest.prompt | Do you wear, or plan to wear, any of these? | Vai tu nēsā vai plāno nēsāt kādu no šīm frizūrām? | 618a335f |  |
| hair-style-interest.options.braids.label | Braids | Bizes | 4777050d |  |
| hair-style-interest.options.weave.label | A weave | Piešūtās treses (weave) | 4fb55fd0 |  |
| hair-style-interest.options.extensions.label | Extensions | Pieaudzēti mati | fe3436af |  |
| hair-style-interest.options.tight_ponytail.label | A tight ponytail or bun | Cieša aste vai cope | 49143892 |  |
| hair-style-interest.options.4.label | None of these | Nekas no minētā | 161f67ca |  |
| hair-style-interest.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| scalp-oil.prompt | How does your scalp feel a day after washing? | Kā jūtas tava galvas āda dienu pēc mazgāšanas? | be2435cc |  |
| scalp-oil.options.oily.label | Oily | Taukaina | 6546a0b1 |  |
| scalp-oil.options.balanced.label | Fine | Labi | fa67303a |  |
| scalp-oil.options.dry.label | Dry or tight | Sausa vai savilkta | 66a6c9b7 |  |
| scalp-oil.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| scalp-marks-cover.prompt | Would you like scars or marks on your scalp kept covered? | Vai vēlies, lai rētas vai citas zīmes uz galvas ādas būtu piesegtas? | e312f662 |  |
| scalp-marks-cover.help | You can skip this. | Šo vari izlaist. | a58fdd56 |  |
| scalp-marks-cover.options.true.label | Yes | Jā | 85a39ab3 |  |
| scalp-marks-cover.options.false.label | No | Nē | 1ea442a1 |  |
| scalp-marks-cover.options.null.label | Skip | Izlaist | 28d03596 |  |
| colour-grey-pattern.prompt | Where is most of your grey? | Kur tev sirmo matu ir visvairāk? | d5689054 |  |
| colour-grey-pattern.options.even.label | Spread evenly | Vienmērīgi pa visu galvu | ff97de76 |  |
| colour-grey-pattern.options.temples.label | At the temples | Deniņos | f4bcabfc |  |
| colour-grey-pattern.options.front.label | At the front | Priekšpusē | 9c180d88 |  |
| colour-grey-pattern.options.patches.label | In patches | Laukumos | 9d8f6668 |  |
| colour-grey-pattern.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| life-headwear.prompt | Do you often wear any of these? | Vai tu bieži nēsā kaut ko no šī? | 47be062d |  |
| life-headwear.options.hat_or_cap.label | A hat, cap or hard hat | Cepure, naģene vai aizsargķivere | a6adcd4d |  |
| life-headwear.options.helmet.label | A helmet | Ķivere | 7405251b |  |
| life-headwear.options.scarf_or_turban.label | A head scarf or turban | Lakats vai turbāns | 2681e5e6 |  |
| life-headwear.options.3.label | None of these | Nekas no minētā | 161f67ca |  |
| life-headwear.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| life-tie-back-needed.prompt | Do you need to be able to tie your hair back, for work or sport? | Vai tev darbā vai sportojot ir svarīgi matus saņemt astē? | 6891cb61 |  |
| life-tie-back-needed.options.true.label | Yes | Jā | 85a39ab3 |  |
| life-tie-back-needed.options.false.label | No | Nē | 1ea442a1 |  |
| life-tie-back-needed.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| life-hair-covered-at-work.prompt | Does your work ask for your hair to be covered with a net or cap? | Vai tavā darbā mati ir jānosedz ar tīkliņu vai cepurīti? | 902f17db |  |
| life-hair-covered-at-work.options.true.label | Yes | Jā | 85a39ab3 |  |
| life-hair-covered-at-work.options.false.label | No | Nē | 1ea442a1 |  |
| life-hair-covered-at-work.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| life-workplace-style.prompt | Does your work or daily life set any limits on how your hair looks? | Vai tavs darbs vai ikdiena nosaka ierobežojumus matu izskatam? | 7a75e0e9 |  |
| life-workplace-style.options.no_limits.label | No limits | Nekādu ierobežojumu | 9f425ca1 |  |
| life-workplace-style.options.creative.label | Creative looks are welcome | Radošs tēls ir atbalstīts | a55bf8bd |  |
| life-workplace-style.options.conservative.label | A classic, polished look is expected | Tiek sagaidīts klasisks, kopts tēls | 8e186ab3 |  |
| life-workplace-style.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| life-grow-out-goal.prompt | Are you letting your hair grow longer? | Vai tu audzē garākus matus? | 1b1a5cbf |  |
| life-grow-out-goal.options.true.label | Yes, I am growing it | Jā, audzēju | 5ac6226c |  |
| life-grow-out-goal.options.false.label | No | Nē | 1ea442a1 |  |
| life-grow-out-goal.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| life-growing-out-fringe.prompt | Are you growing out a fringe? | Vai tu ataudzē priekšmatus? | 348de2a8 |  |
| life-growing-out-fringe.options.true.label | Yes | Jā | 85a39ab3 |  |
| life-growing-out-fringe.options.false.label | No | Nē | 1ea442a1 |  |
| life-growing-out-fringe.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| life-swims-often.prompt | Do you swim, or spend a lot of time in the sea or a pool? | Vai tu peldi vai pavadi daudz laika jūrā vai baseinā? | f43463fb |  |
| life-swims-often.options.true.label | Yes | Jā | 85a39ab3 |  |
| life-swims-often.options.false.label | No | Nē | 1ea442a1 |  |
| life-swims-often.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| life-humid-climate.prompt | Does humid weather change how your hair behaves? | Vai mitrs laiks maina to, kā uzvedas tavi mati? | 68d7b273 |  |
| life-humid-climate.options.true.label | Yes | Jā | 85a39ab3 |  |
| life-humid-climate.options.false.label | No | Nē | 1ea442a1 |  |
| life-humid-climate.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| life-event-soon.prompt | Do you have a big event in the next few weeks? | Vai tev tuvākajās nedēļās gaidāms kāds svarīgs notikums? | 333dbee4 |  |
| life-event-soon.options.true.label | Yes | Jā | 85a39ab3 |  |
| life-event-soon.options.false.label | No | Nē | 1ea442a1 |  |
| life-event-soon.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| wishes.prompt | Is there anything you would like your hair to do for your face? | Vai ir kas tāds, ko ar matiem vēlētos panākt savas sejas izskatam? | 66e44258 |  |
| wishes.help | Choose any, or none. We only use these if you pick them. | Izvēlies jebkuru vai nevienu. Mēs to ņemsim vērā tikai tad, ja kaut ko atzīmēsi. | 6f473e2f |  |
| wishes.options.wish.face_length=soften.label | Hair that adds fullness at the sides | Mati, kas piešķir apjomu sānos | bbc05055 |  |
| wishes.options.wish.face_length=emphasise.label | Hair that keeps a long line down my face | Mati, kas saglabā garu līniju gar seju | c8890932 |  |
| wishes.options.wish.face_width=soften.label | Hair with more height and closer sides | Mati ar lielāku apjomu augšpusē un piekļautākiem sāniem | d6b6abd4 |  |
| wishes.options.wish.face_width=emphasise.label | Hair with a soft, rounded shape around my face | Mati ar maigu, noapaļotu formu ap seju | c04302dc |  |
| wishes.options.wish.forehead=soften.label | Hair that covers more of my forehead | Mati, kas vairāk piesedz pieri | 05e5f8c7 |  |
| wishes.options.wish.forehead=emphasise.label | Hair that leaves my forehead open | Mati, kas atstāj pieri atsegtu | 1b058280 |  |
| wishes.options.wish.cheekbones=emphasise.label | Show off my cheekbones | Izcelt vaigu kaulus | bf9bc47c |  |
| wishes.options.wish.cheekbones=soften.label | Soften my cheekbones | Padarīt vaigu kaulus maigākus | c8c349bc |  |
| wishes.options.wish.eyes=emphasise.label | Draw attention to my eyes | Pievērst uzmanību acīm | 0f7e7e58 |  |
| wishes.options.wish.nose=soften.label | Make my nose less of a focus | Novērst uzmanību no deguna | a99ae0b1 |  |
| wishes.options.wish.ears=soften.label | Make my ears show less | Piesegt ausis | 580584bd |  |
| wishes.options.wish.ears=emphasise.label | Happy to show my ears | Labprāt atsedzu ausis | 09544cf8 |  |
| wishes.options.wish.jaw=emphasise.label | Hair with a clean line at my jaw | Mati ar precīzu līniju pie žokļa | a93585cf |  |
| wishes.options.wish.jaw=soften.label | Hair with soft layers around my jaw | Mati ar vieglām pakāpēm ap žokli | 1b2691c6 |  |
| wishes.options.wish.chin=emphasise.label | Hair that ends in a clean line at my chin | Mati, kas beidzas ar precīzu līniju pie zoda | 183167ad |  |
| wishes.options.wish.chin=soften.label | Hair that falls past my chin with soft ends | Mati, kas sniedzas pāri zodam ar maigiem galiem | 967b9ca8 |  |
| wishes.options.wish.hairline=soften.label | Make my hairline show less | Piesegt matu augšanas līniju | 3c52743a |  |
| wishes.options.wish.hairline=emphasise.label | Show my hairline | Atsegt matu augšanas līniju | f1153c85 |  |
| wishes.options.wish.height=soften.label | Less height on top | Mazāku pacēlumu virspusē | 55463c4c |  |
| wishes.options.wish.height=emphasise.label | More height on top | Lielāku pacēlumu virspusē | fc6c9c02 |  |
| wishes.options.wish.fullness=emphasise.label | Make my hair look fuller | Padarīt matus kuplākus | b432c9a1 |  |
| wishes.options.wish.contrast=soften.label | Soften the contrast with my skin | Padarīt kontrastu ar ādu maigāku | d25c6670 |  |
| wishes.options.wish.contrast=emphasise.label | More contrast with my skin | Izteiktāku kontrastu ar ādu | ab893f6e |  |
| wishes.options.wish.overall_balance=soften.label | A shape that evens out my proportions | Forma, kas līdzsvaro manas proporcijas | 90661a7b |  |
| wishes.options.wish.overall_balance=preserve.label | A shape that keeps my own proportions | Forma, kas saglabā manas proporcijas | 92dd46b6 |  |
| wishes.options.wish.overall_balance=emphasise.label | A shape that plays up my own proportions | Forma, kas izceļ manas proporcijas | 5bf4fe3f |  |
| c10-beard.because | If your work asks for hair to be covered, short facial hair is easiest to keep neat under a beard cover. | Ja tavā darbā prasa nosegt matus, īsu bārdu ir visvieglāk uzturēt kārtīgu zem bārdas tīkliņa. | 4d940c27 |  |
| d02.because | You would like fullness at the sides, so a beard kept fuller at the sides and shorter at the chin goes with it. | Tu vēlies kuplumu sānos, tāpēc tam piestāv bārda, kas sānos ir kuplāka, bet pie zoda – īsāka. | 2aa694c9 |  |
| d02-b.because | You would like to soften the length of your face, so a beard kept short at the chin helps. | Tu vēlies vizuāli mīkstināt sejas garumu, tāpēc palīdzēs bārda, kas pie zoda apgriezta īsa. | 2da09c39 |  |
| d03.because | You would like more height and closer sides. A beard kept close at the sides and a little longer at the chin goes with that. | Tu vēlies vairāk apjoma augšpusē un piegulošākus sānus. Tam piestāv bārda, kas sānos ir piegulošāka, bet pie zoda – nedaudz garāka. | dd0b2df0 |  |
| d03-b.because | You would like to soften width, so a natural cheek line avoids a hard straight edge across the cheeks. | Tu vēlies vizuāli mīkstināt sejas platumu, tāpēc dabiska vaigu līnija palīdz izvairīties no asas, taisnas kontūras uz vaigiem. | 8055118a |  |
| d04.because | You want your jaw line to show, so keeping the beard short and well-defined along it makes the most of it. | Tu vēlies, lai žokļa līnija būtu redzama, tāpēc īsa un precīzi iezīmēta bārda gar žokli palīdzēs to izcelt vislabāk. | 7615901c |  |
| d04-b.because | You want your jaw line to show, so a crisp cheek line gives the beard a clean edge that frames it. | Tu vēlies, lai žokļa līnija būtu redzama, tāpēc precīza vaigu līnija piešķir bārdai skaidru kontūru, kas to ierāmē. | 743e5e24 |  |
| d06.because | You would like to balance your face, so a fuller beard at the chin can add width to the lower half. | Tu vēlies līdzsvarot sejas proporcijas, tāpēc kuplāka bārda pie zoda var piešķirt platumu sejas apakšdaļai. | f3846762 |  |
| d07.because | With uneven growth, a short beard that follows your natural lines looks neat and is easy to keep. | Ja bārda aug nevienmērīgi, īsa bārda, kas seko tavām dabiskajām līnijām, izskatās kārtīga un ir viegli kopjama. | 3e691dc4 |  |
| d07-b.because | With uneven growth, a natural cheek line looks neater than a sharp one. | Ja bārda aug nevienmērīgi, dabiska vaigu līnija izskatās kārtīgāka nekā asi iezīmēta. | 0144f36a |  |
| d08.because | A neckline about two fingers above the Adam's apple keeps the beard tidy and the jaw line clear. | Kakla līnija apmēram divu pirkstu platumā virs Ādama ābola palīdz uzturēt bārdu kārtīgu un žokļa līniju – izteiktu. | d871b4ac |  |
| d20.because | Tightly curled hair can grow back into the skin after a very close shave. Leaving a little length is kinder to skin. | Sīki cirtaini matiņi pēc ļoti gludas skūšanas var ieaugt ādā. Atstāt nelielu garumu ir ādai saudzīgāk. | 83f97cb7 |  |
| d20-b.because | Tightly curled hair can grow back into the skin after close shaving. A natural cheek line, not razor-edged, is kinder to skin. | Sīki cirtaini matiņi pēc gludas skūšanas var ieaugt ādā. Dabiska vaigu līnija, kas nav iezīmēta ar bārdasnazi, ir ādai saudzīgāka. | ac64b400 |  |
| c11-colour.reason | Your work favours a polished classic look | Tavā darbā dod priekšroku koptam, klasiskam tēlam | fd59bcd2 |  |
| c12-colour.reason | Your work is open to creative looks | Tavā darbā ir atvērti radošam tēlam | a83ba9e4 |  |
| e01.reason | You told us your skin leans warm | Tu norādīji, ka tavai ādai ir silts apakštonis | e7e1733c |  |
| e02.reason | You told us your skin leans cool | Tu norādīji, ka tavai ādai ir vēss apakštonis | c7a5d469 |  |
| e03.reason | You told us your skin leans neutral | Tu norādīji, ka tavai ādai ir neitrāls apakštonis | aa97d73e |  |
| e06.reason | You would like less contrast with your skin | Tu vēlies mazāku kontrastu ar ādas toni | 2599d94c |  |
| e06-b.reason | You would like less contrast with your skin | Tu vēlies mazāku kontrastu ar ādas toni | 2599d94c |  |
| e07.reason | You would like your face to look more defined | Tu vēlies, lai sejas vaibsti izskatītos izteiksmīgāki | 1b2fe6a5 |  |
| e08.reason | You would like your eyes to stand out | Tu vēlies izcelt acis | 0ff5f743 |  |
| e09.reason | You would like your eyes to stand out | Tu vēlies izcelt acis | 0ff5f743 |  |
| e10.reason | You would like your eyes to stand out | Tu vēlies izcelt acis | 0ff5f743 |  |
| e11.reason | You have a little grey and prefer fewer colour visits | Tev ir nedaudz sirmu matu un vēlies retākas krāsošanas vizītes | 15f4d48c |  |
| e12.reason | You have some grey and prefer a colour that grows out softly | Tev vietām ir sirmi mati un vēlies krāsu, kas ataug maigi | c3add95b |  |
| e13.reason | You have mostly grey hair and would like it covered | Tev pārsvarā ir sirmi mati un vēlies tos nosegt | a8392eb0 |  |
| e14.reason | You would like to embrace your grey | Tu vēlies pieņemt savu sirmumu | 486da9f1 |  |
| e15.reason | Your grey sits mostly around the face | Tev sirmie mati pārsvarā ir ap seju | a2f338f1 |  |
| e15-low-grey.reason | Your grey sits mostly around the face | Tev sirmie mati pārsvarā ir ap seju | a2f338f1 |  |
| e25.reason | You would like fewer colour visits | Tu vēlies retākas krāsošanas vizītes | 3b86b750 |  |
| e26.reason | You do not mind regular visits | Tev nav iebildumu pret regulārām vizītēm | 03e372a8 |  |
| e27.reason | You like colour but your workplace is classic | Tev patīk krāsa matos, bet tavā darbavietā valda klasisks stils | 075cdc29 |  |
| direction-lighter.reason | You would like to go lighter | Tu vēlies gaišākus matus | 919c1fd0 |  |
| direction-darker.reason | You would like to go darker | Tu vēlies tumšākus matus | a4a03466 |  |
| direction-tone.reason | You would like a new tone at about the same depth | Tu vēlies jaunu toni apmēram tādā pašā dziļumā | 0a825b5f |  |
| direction-refresh.reason | You would like to refresh the colour you have | Tu vēlies atsvaidzināt esošo matu krāsu | bf7e7517 |  |
| direction-grey.reason | You would like to cover or blend your grey | Tu vēlies nosegt vai sapludināt sirmos matus | 49bdb973 |  |
| direction-vivid.reason | You would like a bright fashion colour | Tu vēlies košu modes toni | e9e006dd |  |
| direction-natural.reason | You would like your natural colour back | Tu vēlies atgūt dabisko matu krāsu | 4885ce76 |  |
| grey-goal-blend.reason | You would like your grey blended softly | Tu vēlies maigi sapludināt sirmos matus | fec43c37 |  |
| grey-goal-cover.reason | You would like your grey covered | Tu vēlies nosegt sirmos matus | 8778e321 |  |
| grey-goal-embrace.reason | You want your grey to show | Tu vēlies, lai sirmie mati būtu redzami | 9d8cdaf3 |  |
| grey-goal-silver.reason | You want to move to silver or white | Tu vēlies pāriet uz sudrabotu vai baltu toni | fd39c650 |  |
| correction-needs-colour.because | There is no earlier colour on your hair to correct. | Tavos matos nav iepriekšējas krāsas, ko koriģēt. | b83479ac |  |
| no-length-to-melt.because | Hair this short has no length for a colour that melts from root to ends. | Tik īsiem matiem trūkst garuma, lai izveidotu krāsas pludinājumu no saknēm līdz galiem. | 8210cf33 |  |
| darker-no-lightening.because | You asked to go darker, so looks that make any of your hair lighter are left out. | Tu vēlējies tumšākus matus, tāpēc tēli, kuros kāda matu daļa kļūst gaišāka, ir izlaisti. | 1d392ca5 |  |
| darker-no-lightening-roots.because | You asked to go darker, so looks that make any of your hair lighter are left out. | Tu vēlējies tumšākus matus, tāpēc tēli, kuros kāda matu daļa kļūst gaišāka, ir izlaisti. | 1d392ca5 |  |
| darker-no-lighter-pieces.because | You asked to go darker, so looks with lighter pieces, such as highlights, tips or a face frame, are left out. | Tu vēlējies tumšākus matus, tāpēc tēli ar gaišākiem akcentiem, piemēram, šķipsnām, gaišiem galiem vai sejas ierāmējumu, ir izlaisti. | bf1f5717 |  |
| darker-no-lightener.because | You asked to go darker, so looks that need lightener are left out. | Tu vēlējies tumšākus matus, tāpēc tēli, kuriem vajadzīgs balinātājs, ir izlaisti. | 480ad130 |  |
| lighter-no-darkening.because | You asked to go lighter, so looks that make your hair two or more levels darker are left out. | Tu vēlējies gaišākus matus, tāpēc tēli, kas padara matus par diviem vai vairāk toņiem tumšākus, ir izlaisti. | fd2d3b93 |  |
| lighter-no-darkening-roots.because | You asked to go lighter, so looks that make your hair two or more levels darker are left out. | Tu vēlējies gaišākus matus, tāpēc tēli, kas padara matus par diviem vai vairāk toņiem tumšākus, ir izlaisti. | fd2d3b93 |  |
| natural-no-lighter-pieces.because | You asked for your natural colour. So looks with lighter pieces, like highlights or tips, are left out. | Tu vēlējies savu dabisko matu krāsu, tāpēc tēli ar gaišākiem akcentiem, piemēram, šķipsnām vai gaišiem galiem, ir izlaisti. | 6563717f |  |
| natural-not-far.because | You asked for your natural colour, so looks two or more levels away from it are left out. | Tu vēlējies savu dabisko matu krāsu, tāpēc tēli, kas no tās atšķiras par diviem vai vairāk toņiem, ir izlaisti. | a4d2bec5 |  |
| natural-not-far-other-goal.because | You asked for your natural colour, so looks two or more levels away from it are left out. | Tu vēlējies savu dabisko matu krāsu, tāpēc tēli, kas no tās atšķiras par diviem vai vairāk toņiem, ir izlaisti. | a4d2bec5 |  |
| natural-not-far-grey.because | You asked for your natural colour with your grey showing, so looks that lighten your hair far from it are left out. | Tu vēlējies savu dabisko matu krāsu, atstājot sirmos matus redzamus, tāpēc tēli, kas padara matus daudz gaišākus par tavu dabisko toni, ir izlaisti. | ccca52cf |  |
| lighter-must-lift.because | You asked to go lighter, so looks that lift none of your hair are left out. | Tu vēlējies gaišāku toni, tāpēc varianti, kas nepadara gaišāku nevienu matu daļu, netiek iekļauti. | 0bfc6db4 |  |
| cannot-reach-shade.because | Some shades of these looks are lighter than your hair can be taken without lightener, so they are left out. | Daži toņi šajos tēlos ir gaišāki, nekā tavos matos iespējams iegūt bez balinātāja, tāpēc tie ir izlaisti. | 10c12bd8 |  |
| lighter-needs-lightener.because | You asked to go lighter, so looks without lightener, which cannot lift your hair, are left out. | Tu vēlējies gaišākus matus, tāpēc tēli bez balinātāja, ar kuriem matus nevar padarīt gaišākus, ir izlaisti. | afdcb53e |  |
| lighter-no-lowlights.because | You asked to go lighter, so lowlights, which add darker pieces, are left out. | Tu vēlējies gaišāku toni, tāpēc tumšās šķipsnas (lowlights), kas piešķir tumšākus akcentus, netiek iekļautas. | 40e455a4 |  |
| darker-must-darken.because | You asked to go darker, so looks that take none of your hair darker are left out. | Tu vēlējies tumšāku toni, tāpēc varianti, kas nepadara tumšāku nevienu matu daļu, netiek iekļauti. | 48477dfa |  |
| bright-must-be-bright.because | You asked for a bright colour, so looks that are not bright are left out. | Tu vēlējies košu krāsu, tāpēc varianti, kas nav koši, netiek iekļauti. | 933a10cf |  |
| grey-must-treat-grey.because | You asked to cover or blend your grey, so looks that leave it as it is are left out. | Tu vēlējies nosegt vai sapludināt sirmos matus, tāpēc tēli, kuros tie atstāti neskarti, ir izlaisti. | d802e148 |  |
| bright-only-if-asked.because | You did not ask for a bright colour, so bright colours are left out. | Tu nevēlējies košu krāsu, tāpēc košie toņi netiek iekļauti. | 01dd86f1 |  |
| deep-shade-hard-to-undo.because | Very dark shades are hard to undo, so looks four or more levels darker than your hair are left out. | Ļoti tumšus toņus pēc tam ir grūti izņemt, tāpēc tēli, kas ir par četriem vai vairāk toņiem tumšāki par taviem matiem, ir izlaisti. | 70760282 |  |
| deep-shade-hard-to-undo-roots.because | Very dark shades are hard to undo, so looks four or more levels darker than your hair are left out. | Ļoti tumšus toņus pēc tam ir grūti izņemt, tāpēc tēli, kas ir par četriem vai vairāk toņiem tumšāki par taviem matiem, ir izlaisti. | 70760282 |  |
| deep-shade-not-cover.because | Very dark shades are hard to undo, so looks four or more levels darker than your hair are left out. | Ļoti tumšus toņus pēc tam ir grūti izņemt, tāpēc tēli, kas ir par četriem vai vairāk toņiem tumšāki par taviem matiem, ir izlaisti. | 70760282 |  |
| deep-shade-not-cover-roots.because | Very dark shades are hard to undo, so looks four or more levels darker than your hair are left out. | Ļoti tumšus toņus pēc tam ir grūti izņemt, tāpēc tēli, kas ir par četriem vai vairāk toņiem tumšāki par taviem matiem, ir izlaisti. | 70760282 |  |
| deep-shade-small-change.because | Very dark shades are hard to undo, so looks four or more levels darker than your hair are left out. | Ļoti tumšus toņus pēc tam ir grūti izņemt, tāpēc tēli, kas ir par četriem vai vairāk toņiem tumšāki par taviem matiem, ir izlaisti. | 70760282 |  |
| deep-shade-small-change-roots.because | Very dark shades are hard to undo, so looks four or more levels darker than your hair are left out. | Ļoti tumšus toņus pēc tam ir grūti izņemt, tāpēc tēli, kas ir par četriem vai vairāk toņiem tumšāki par taviem matiem, ir izlaisti. | 70760282 |  |
| damaged-no-lightening-lengths.because | Your hair is damaged, so looks that lighten the lengths are left out. Ask again after a few months of care. | Tavi mati ir bojāti, tāpēc varianti, kas padara gaišāku matu garumu, netiek iekļauti. Pajautā vēlreiz pēc dažiem kopšanas mēnešiem. | 8c9dceee |  |
| damaged-lengths-level-unknown.because | Your hair is damaged and the level of its lengths is not known, so looks with lightener are left out. Ask again after a few months of care. | Tavi mati ir bojāti un to garuma toņa līmenis nav zināms, tāpēc varianti ar balinātāju netiek iekļauti. Pajautā vēlreiz pēc dažiem kopšanas mēnešiem. | dd4db32d |  |
| lightened-twice-no-more.because | The lengths you have now were lightened two or more times, so looks that lighten them again are left out. | Tavs pašreizējais matu garums ir padarīts gaišāks divas vai vairāk reizes, tāpēc varianti, kas to padarītu vēl gaišāku, netiek iekļauti. | 18dd67cc |  |
| lightened-twice-level-unknown.because | The lengths you have now were lightened two or more times and their level is not known, so looks with lightener are left out. | Tavs pašreizējais matu garums ir padarīts gaišāks divas vai vairāk reizes un tā toņa līmenis nav zināms, tāpēc varianti ar balinātāju netiek iekļauti. | 938cc0f6 |  |
| grey-goal-blend-only.because | You want your grey blended softly, so looks that cover it, leave it as it is or take you to silver are left out. | Tu vēlies maigi sapludināt sirmos matus, tāpēc tēli, kas tos nosedz, atstāj neskartus vai padara sudrabainus, ir izlaisti. | 899e68ea |  |
| grey-goal-shows.because | You want your grey to show, so looks that cover or tint it are left out. | Tu vēlies, lai sirmie mati būtu redzami, tāpēc tēli, kas tos nosedz vai ietonē, ir izlaisti. | 1ddb0731 |  |
| grey-goal-silver-no-colour.because | You want to move to silver or white, so coloured looks that only leave your grey showing are left out. | Tu vēlies pāriet uz sudrabainu vai baltu toni, tāpēc tēli ar krāsotiem matiem, kuros sirmie mati tikai atstāti redzami, ir izlaisti. | 23dcf216 |  |
| grey-goal-cover-only.because | You want your grey covered, so looks that leave it showing are left out. | Tu vēlies nosegt sirmos matus, tāpēc varianti, kuros tie paliek redzami, netiek iekļauti. | 6a657aa9 |  |
| same-depth-not-lighter.because | You asked to keep your depth, so looks two or more levels lighter are left out. | Tu vēlējies saglabāt savu toņa dziļumu, tāpēc tēli, kas ir par diviem vai vairāk toņiem gaišāki, ir izlaisti. | 624442a3 |  |
| same-depth-not-lighter-roots.because | You asked to keep your depth, so looks two or more levels lighter are left out. | Tu vēlējies saglabāt savu toņa dziļumu, tāpēc tēli, kas ir par diviem vai vairāk toņiem gaišāki, ir izlaisti. | 624442a3 |  |
| same-depth-no-lighter-pieces.because | You asked to keep your depth, so looks with lighter pieces, such as highlights, tips or a face frame, are left out. | Tu vēlējies saglabāt savu toņa dziļumu, tāpēc tēli ar gaišākiem akcentiem, piemēram, šķipsnām, gaišiem galiem vai sejas ierāmējumu, ir izlaisti. | ba26a1d3 |  |
| refresh-no-new-pieces.because | You asked to refresh what you have, and you have no highlights now, so looks with lighter pieces are left out. | Tu vēlējies atsvaidzināt to, kas tev jau ir, un tev šobrīd nav šķipsnu, tāpēc tēli ar gaišākām šķipsnām ir izlaisti. | d9e88bc3 |  |
| same-depth-not-darker.because | You asked to keep your depth, so looks two or more levels darker are left out. | Tu vēlējies saglabāt savu toņa dziļumu, tāpēc tēli, kas ir par diviem vai vairāk toņiem tumšāki, ir izlaisti. | 8a4c05b4 |  |
| same-depth-not-darker-roots.because | You asked to keep your depth, so looks two or more levels darker are left out. | Tu vēlējies saglabāt savu toņa dziļumu, tāpēc tēli, kas ir par diviem vai vairāk toņiem tumšāki, ir izlaisti. | 8a4c05b4 |  |
| same-depth-roots-near-worn.because | You asked to keep your depth, so looks with roots two levels or more from both your own colour and the one you wear are left out. | Tu vēlējies saglabāt savu toņa dziļumu, tāpēc tēli, kuru saknes par diviem vai vairāk toņiem atšķiras gan no tavas dabiskās, gan pašreizējās krāsas, ir izlaisti. | 7731de24 |  |
| no-grey-no-grey-looks.because | You have no grey, so grey cover and grey blending are left out. | Tev nav sirmu matu, tāpēc sirmo matu nosegšana un sapludināšana ir izlaista. | c78f8f2a |  |
| no-grey-no-grey-looks-unasked.because | You have no grey, so grey cover and grey blending are left out. | Tev nav sirmu matu, tāpēc sirmo matu nosegšana un sapludināšana ir izlaista. | c78f8f2a |  |
| coverage-lift-limit.because | Grey cover cannot lift your natural shade that far, so it would turn out patchy. | Sirmo matu krāsa nespēj tik ļoti pacelt tavu dabisko toni, tāpēc rezultāts būtu nevienmērīgs. | 34721f5a |  |
| deep-shade-note.because | Black and very dark shades are very hard to undo. | No melniem un ļoti tumšiem toņiem ir ļoti grūti atbrīvoties. | b1192255 |  |
| direction-no-grey.reason | This service is for hair with grey in it | Šis pakalpojums ir paredzēts matiem ar sirmumu | 6b48934e |  |
| direction-no-grey-default.reason | This service is for hair with grey in it | Šis pakalpojums ir paredzēts matiem ar sirmumu | 6b48934e |  |
| e29.reason | Your natural colour is deep and you would like a subtle change | Tava dabiskā matu krāsa ir tumša, un tu vēlies neuzkrītošas pārmaiņas | 599a1682 |  |
| e30.reason | Your hair is not very thick | Tavi mati nav pārāk biezi | 9baaea88 |  |
| e36.reason | You are growing your hair longer | Tu audzē garākus matus | dffdebe9 |  |
| home-only-colour.reason | You would rather colour your hair at home | Tu labprātāk krāso matus mājās | 472aa7ee |  |
| j3-silver-gloss-grey.because | With this much grey, a silver gloss mostly tones the grey you already have. The label counts it as lightening from your darkest strands, so it can be more careful than you need. | Ja sirmuma ir tik daudz, sudraba glāss galvenokārt tonē jau esošos sirmos matus. Produkta norādēs tas tiek uzskatīts par gaišināšanu, rēķinot no tumšākajām šķipsnām, tāpēc ieteikums var būt piesardzīgāks, nekā tev patiesībā nepieciešams. | 5ec87e07 |  |
| wanted-blonde.reason | You have this colour in mind | Tev padomā ir šī matu krāsa | 2a643929 |  |
| wanted-brunette.reason | You have this colour in mind | Tev padomā ir šī matu krāsa | 2a643929 |  |
| wanted-red-copper.reason | You have this colour in mind | Tev padomā ir šī matu krāsa | 2a643929 |  |
| wanted-black.reason | You have this colour in mind | Tev padomā ir šī matu krāsa | 2a643929 |  |
| wanted-grey-silver.reason | You have this colour in mind | Tev padomā ir šī matu krāsa | 2a643929 |  |
| wiry-grey-coverage.because | Wiry grey can resist colour. Ask your colourist if it needs a softening step or more time. | Cieti un nepakļāvīgi sirmi mati var sliktāk uzņemt krāsu. Pajautā savam koloristam, vai nav nepieciešama to mīkstināšana vai ilgāks iedarbības laiks. | 1b83673a |  |
| a01.reason | You would like hair that adds fullness at the sides | Tu vēlētos matus, kas piešķir kuplumu sānos | afabf45f |  |
| a02.reason | You would like hair that keeps a long line down your face | Tu vēlētos matus, kas saglabā garu līniju gar seju | 1559d684 |  |
| a03.reason | You would like more height and closer sides | Tu vēlētos vairāk apjoma augšpusē un piegulošākus sānus | a92cf3d2 |  |
| a04.reason | You would like a soft, rounded shape around your face | Tu vēlētos maigu, noapaļotu formu ap seju | 0ef9fc45 |  |
| a05.reason | You would like hair that covers more of your forehead | Tu vēlētos matus, kas vairāk piesedz pieri | 430fa810 |  |
| a06.reason | You would like to show your forehead | Vēlies atsegt pieri | d4f2f5da |  |
| a08.reason | You would like soft layers around your jaw | Tu vēlētos maigas pakāpes ap žokļa līniju | da94e201 |  |
| a09.reason | You would like a clean line at your jaw | Tu vēlētos tīru līniju pie žokļa | 57e76f87 |  |
| a12.reason | You would like your cheekbones to stand out | Vēlies izcelt vaigu kaulus | 68f0b5a0 |  |
| a13.reason | You would like your cheekbones to feel softer | Vēlies vizuāli mīkstināt vaigu kaulus | 36b3559d |  |
| a16.reason | You want your eyes to take centre stage | Vēlies, lai uzmanības centrā būtu acis | 96e480e6 |  |
| a17.reason | You would like your nose to be less of a focus | Vēlies mazāk akcentēt degunu | f4ce2537 |  |
| a18.reason | You would like your ears to show less | Vēlies mazāk atsegt ausis | d0f52a67 |  |
| a19.reason | You are happy to show your ears | Labprāt atsedz ausis | b96e631f |  |
| a23.reason | You would like your hairline to show less | Vēlies mazāk atsegt matu augšanas līniju | ca0681d2 |  |
| a24.reason | You like your natural hairline | Tev patīk sava dabiskā matu augšanas līnija | 4413b89e |  |
| a27.reason | You would like less height on top | Vēlies mazāku pacēlumu matu augšdaļā | cede8e34 |  |
| a28.reason | You would like a little more height on top | Vēlies nedaudz lielāku pacēlumu matu augšdaļā | 233b443e |  |
| a29.reason | You would like hair that falls past your chin with soft ends | Tu vēlētos matus, kas sniedzas zem zoda ar maigiem galiem | 72f655bf |  |
| a30.reason | You would like hair that ends in a clean line at your chin | Tu vēlētos matus, kas beidzas ar tīru līniju pie zoda | 3a6b465c |  |
| b01.reason | Curls and coils keep their shape best in cuts designed around them | Cirtaini un sīki cirtaini mati vislabāk saglabā formu griezumos, kas pielāgoti tieši tiem | b5fb6cef |  |
| b02.because | Curls spring up as they dry, so this length can sit shorter than it looks when wet. | Izžūstot cirtas saraujas, tāpēc šis garums var izskatīties īsāks nekā mitros matos. | 0d2d3227 |  |
| b03.reason | Coils look their best in shapes that follow how they grow | Sīki cirtaini mati vislabāk izskatās formās, kas seko to dabiskajam augšanas virzienam | 517fcba9 |  |
| b04.reason | Waves move best with light layers and soft edges | Viļņainiem matiem kustību vislabāk piešķir viegla pakāpe un maigas pārejas | 73041008 |  |
| b05.reason | Straight hair shows clean lines well | Taisnos matos lieliski izceļas tīras, precīzas līnijas | c1cd7d19 |  |
| b06.reason | Your hair has more than one pattern, and soft layers blend it best | Taviem matiem ir vairāku veidu tekstūra, un maiga pakāpe to vislabāk sapludina | 22d0c73c |  |
| texture-poor-fit.because | These cuts do not work with your hair texture, so they are left out. | Šie griezumi nav piemēroti tavai matu tekstūrai, tāpēc tie netiek iekļauti. | 621b8239 |  |
| density-poor-fit.because | These cuts do not suit how much hair you have, so they are left out. | Šie griezumi nav piemēroti tavam matu biezumam, tāpēc tie netiek iekļauti. | a1bbb078 |  |
| curl-shape-straight-hair.because | These cuts are shaped for curls or a perm, so they are left out for straight or wavy hair. | Šie griezumi ir pielāgoti cirtām vai ilgviļņiem, tāpēc taisniem vai viļņainiem matiem tie netiek iekļauti. | 356917da |  |
| thick-cut-low-density.because | These cuts are made for a lot of hair, so they are left out. | Šie griezumi ir paredzēti bieziem matiem, tāpēc tie netiek iekļauti. | d766cec2 |  |
| traction-high-tension.because | Your hairline needs a rest from pulling, so styles that pull tight are left out. | Tavai matu augšanas līnijai ir jāatpūšas no nostiepšanas, tāpēc frizūras, kas cieši savelk matus, netiek iekļautas. | ec1cc2c4 |  |
| b07.because | Curly fringes spring up as they dry, so a very short or blunt fringe can sit higher than you expect. | Izžūstot cirtaini priekšmati saraujas, tāpēc ļoti īsi vai taisni griezti priekšmati var pacelties augstāk, nekā gaidīts. | d37e090b |  |
| b09.reason | Your hair is fine and not very thick | Tavi mati ir smalki un ne pārāk biezi | 17cedfc5 |  |
| b10.reason | Your hair is fine but plentiful | Tavi mati ir smalki, bet to ir daudz | 573a3b61 |  |
| b11.reason | Thick, plentiful hair can feel heavy | Biezi un kupli mati var šķist smagi | c504f74f |  |
| b12.reason | Your strands are coarse but there are fewer of them | Tavi mati ir rupji pēc struktūras, bet to nav daudz | 20811f14 |  |
| b13.reason | You would like your hair to look fuller | Vēlies, lai mati izskatītos kuplāki | fc771f82 |  |
| b14.because | Long, thick hair can get heavy, so cuts that lighten the inside keep it comfortable. | Gari un biezi mati var kļūt smagi, tāpēc griezumi, kas atslogo matu iekšējo apjomu, padara tos daudz ērtākus. | 3d11506b |  |
| b16.because | Fringes sit on the skin and pick up oil quickly. Styles that fall to the side and can be pinned back are easiest to live with. | Priekšmati pieguļ ādai un ātri kļūst taukaini. Visvieglāk sadzīvot ar griezumiem, kas krīt uz sānu un kurus var atspraust. | 31de252c |  |
| b17.reason | Your scalp gets oily and your strands are fine | Tava galvas āda ātri taukojas, un mati ir smalki | 45a31c60 |  |
| b18.reason | Your hair feels dry or damaged and does best with low heat | Tavi mati šķiet sausi vai bojāti, tāpēc tiem vislabāk piemērots saudzīgs karstums | 67aef3e3 |  |
| b19.reason | Your hair feels dry or damaged at the moment | Šobrīd tavi mati šķiet sausi vai bojāti | 64efcb9a |  |
| b20.because | A front cowlick pushes a short or blunt fringe out of place, so this fringe may need daily styling. | Matu virpulis pie pieres var izjaukt īsus vai taisnus priekšmatus, tāpēc tos var nākties ieveidot katru dienu. | 547b77cf |  |
| b21.reason | Your front cowlick can become a feature when the hair is styled its own way | Matu virpulis pie pieres var kļūt par lielisku akcentu, ja matus veido to dabiskajā virzienā | 52428c70 |  |
| b22.because | A crown whorl can make a short top stand up at the crown, so ask for a little extra length to be left over the whorl. | Matu virpulis pakausī var likt īsiem matiem celties stāvus, tāpēc palūdz virs virpuļa atstāt nedaudz vairāk garuma. | a4cc4907 |  |
| b23.because | A double crown makes hair split in two directions. Very short or very long tops are easiest to live with. | Dubults matu virpulis liek matiem dalīties divos virzienos. Visvieglāk ir sadzīvot ar ļoti īsiem vai ļoti gariem matiem augšdaļā. | 7e4265c9 |  |
| b23-b.because | A double crown makes hair split in two directions. Very short or very long tops are easiest to live with. | Dubults matu virpulis liek matiem dalīties divos virzienos. Visvieglāk ir sadzīvot ar ļoti īsiem vai ļoti gariem matiem augšdaļā. | 7e4265c9 |  |
| b24.reason | A nape cowlick lifts short hair | Matu virpulis skaustā paceļ īsus matus | de1e8d6d |  |
| b25.reason | Your hair already wants to part to one side | Tavi mati jau dabiski dalās uz vienu sānu | ccc3107c |  |
| b26.reason | Your hairline sits a little higher at the temples | Tava matu augšanas līnija deniņos ir nedaudz augstāka | 81670d2a |  |
| b27.reason | You would like your hairline to show less and prefer a short top | Vēlies mazāk atsegt matu augšanas līniju un dod priekšroku īsiem matiem augšdaļā | 9f9875f5 |  |
| b27-b.reason | You would like your hairline to show less and prefer to keep some length on top | Vēlies mazāk atsegt matu augšanas līniju un labprātāk saglabātu zināmu garumu augšdaļā | 8a86adc7 |  |
| b28.reason | You are comfortable with your hairline | Tevi apmierina tava matu augšanas līnija | ab4ccf90 |  |
| b29.reason | You would like your hairline to show less and prefer a short top | Vēlies mazāk atsegt matu augšanas līniju un dod priekšroku īsiem matiem augšdaļā | 9f9875f5 |  |
| b29-b.reason | You would like your hairline to show less and prefer to keep some length on top | Vēlies mazāk atsegt matu augšanas līniju un labprātāk saglabātu zināmu garumu augšdaļā | 8a86adc7 |  |
| b30.reason | Your hair is thinner at the crown | Mati pakausī ir plānāki | c54af822 |  |
| b31.because | When the part looks wider, a side part usually shows less of it than a centre part like this one. | Ja celiņš izskatās platāks, sānu celiņā tas parasti ir mazāk pamanāms nekā vidusceliņā, kā šajā griezumā. | 66e3f410 |  |
| b31-b.because | When the part looks wider, avoid styles that pull tightly. Tension adds stress where hair is thinning. | Ja celiņš izskatās platāks, izvairies no cieši savilktiem matu sakārtojumiem. Nostiepums rada papildu slodzi vietās, kur mati kļūst plānāki. | 2c82a3ce |  |
| b31-c.because | When the part looks wider, heavy layers take away fullness. Fewer layers with blunt ends often look fuller. | Ja celiņš izskatās platāks, izteikta pakāpe noņem kuplumu. Mazāka pakāpe un taisni griezti gali bieži izskatās kuplāki. | 647b9385 |  |
| b32.because | Shorter, blunt cuts often make thinning hair look fuller. A doctor or skin specialist can talk you through treatment options. | Īsāki, taisni griezumi bieži vien liek plānākiem matiem izskatīties kuplākiem. Ārsts vai dermatologs varēs pastāstīt par ārstēšanas iespējām. | b9b45348 | safety; checked |
| b33.because | Your hairline needs a rest from pulling. Avoid tight ponytails, braids and other styles that pull for now. | Tavai matu augšanas līnijai nepieciešama atpūta no nostiepuma. Pagaidām izvairies no ciešām astēm, bizēm un citiem sakārtojumiem, kas nostiepj matus. | 750e7136 |  |
| b34.because | Sudden hair loss or patches are worth a check with a doctor; a stylist can help with a cut afterwards. | Pēkšņu matu izkrišanu vai kailus laukumus ir vērts pārbaudīt pie ārsta; stilists varēs palīdzēt ar griezumu pēc tam. | 7c37d368 | safety; checked |
| b35.because | Chemically treated hair is more fragile at the ends, and a razor can fray it. Ask for the texture in this cut to be done with scissors. | Ķīmiski apstrādāti mati galos ir trauslāki, un skuveklis var tos sašķelt. Palūdz, lai šī griezuma tekstūru veido ar šķērēm. | bdfd466b |  |
| b36.because | Relaxed hair is more fragile under tension. Keep braids, weaves, extensions and tight ponytails loose and light. | Ķīmiski taisnoti mati nostiepjot ir trauslāki. Pārliecinies, lai bizes, pieaudzētie mati un ciešas astes būtu vieglas un nebūtu stingri savilktas. | 61cea49f |  |
| b37.because | Daily heat adds up over time, and this cut is usually styled with heat. | Ikdienas karstuma iedarbība laika gaitā uzkrājas, un šo griezumu parasti veido ar karstajiem instrumentiem. | 144f5d5b |  |
| b38.reason | You prefer to skip heat | Labprātāk iztiec bez karstajiem veidošanas instrumentiem | 11a10860 |  |
| b39.because | Permed or relaxed hair grows out in two textures. A sleek, blunt shape like this may need extra smoothing while new growth comes through. | Ja matiem ir ilgviļņi vai tie ir ķīmiski taisnoti, ataugot veidojas divas dažādas tekstūras. Gludai, taisnai formai kā šī var būt nepieciešama papildu nogludināšana, kamēr ataug dabiskie mati. | cb016112 |  |
| b40.because | Smoothing treatments fade as hair grows, and your natural pattern slowly comes back. This shape works with both. | Matu taisnošanas procedūru efekts pakāpeniski mazinās, matiem ataugot, un lēnām atgriežas tava dabiskā matu tekstūra. Šī forma lieliski der abām. | 8406dcb9 |  |
| b40-b.because | Smoothing treatments fade as hair grows, and your natural pattern slowly comes back. This shape works with both. | Matu taisnošanas procedūru efekts pakāpeniski mazinās, matiem ataugot, un lēnām atgriežas tava dabiskā matu tekstūra. Šī forma lieliski der abām. | 8406dcb9 |  |
| c03.reason | You enjoy styling | Tev patīk veidot matus | e2cc1019 |  |
| c05.reason | You are happy to visit often | Labprāt iegriezies salonā bieži | 13ed5efb |  |
| c06.reason | You would like to keep costs down | Vēlies samazināt izdevumus | 4ee4b685 |  |
| c07.reason | You wear a helmet often | Bieži nēsā ķiveri | f8905aa7 |  |
| c08.reason | Hats flatten the top | Cepures pieplacina matus augšdaļā | 562be04e |  |
| c09.because | You need to tie your hair back, so cuts that cannot be tied are left out. | Tev nepieciešams saņemt matus, tāpēc griezumi, kurus nevar saņemt, netiek iekļauti. | 28d9bf2e |  |
| grow-out-keeps-length.because | You are growing your hair, so cuts that take a length off are left out. | Tu audzē matus, tāpēc griezumi, kas noņem garumu, netiek iekļauti. | 55028368 |  |
| grow-out-no-short-crop.because | You are growing your hair, so very short cuts that are kept short by cutting them back are left out. | Tu audzē matus, tāpēc ļoti īsi griezumi, kas regulāri jāapgriež, lai saglabātu īsu garumu, ir izlaisti. | b69ec5b1 |  |
| extensions-keep-length.because | You want to wear extensions or a weave, which need your own length, so cuts that take a length off are left out. | Tu vēlies pieaudzēt matus vai izmantot piešūtās šķipsnas, kam nepieciešams tavs matu garums, tāpēc griezumi, kas saīsina matus, ir izlaisti. | 5c768e9b |  |
| growth-over-a-year.because | These cuts need more than a year of growth, so they are left out. | Šiem griezumiem mati jāaudzē ilgāk par gadu, tāpēc tie netiek iekļauti. | b728b18b |  |
| event-needs-growth.because | You have an event soon, so cuts that need your hair to grow first are left out. | Tev drīz ir gaidāms pasākums, tāpēc griezumi, kuriem vispirms jāpaaudzē mati, netiek iekļauti. | 615d371b |  |
| subtle-no-big-chop.because | You asked for a gentle change, so cuts that take a lot of length off are left out. | Tu vēlējies maigas pārmaiņas, tāpēc griezumi, kas noņem daudz garuma, netiek iekļauti. | fbf6aace |  |
| c10.reason | Your workplace asks for hair to be covered | Tavā darbā prasa nosegt matus | 2af5bbb8 |  |
| c11.reason | Your work favours a polished classic look | Tavā darbā dod priekšroku koptam, klasiskam tēlam | fd59bcd2 |  |
| c12.reason | Your work is open to creative looks | Tavā darbā ir atvērti radošam tēlam | a83ba9e4 |  |
| c13.reason | You are growing your hair out | Tu ataudzē matus | fffe44a1 |  |
| c14.reason | You are growing out a fringe | Tu ataudzē priekšmatus | 07b020e1 |  |
| c14-no-new-fringe.because | You are growing out a fringe, so cuts that bring a short fringe back are left out. | Tu ataudzē priekšmatus, tāpēc griezumi ar īsiem priekšmatiem netiek rādīti. | 95f34ad3 |  |
| c17.reason | You wear a head covering often | Bieži nēsā galvassegu | 89dd635f |  |
| c18.reason | You are often in the water | Bieži uzturies ūdenī | abc08a85 |  |
| c19.reason | Damp air brings out your natural pattern | Mitrs gaiss izceļ tavu dabisko matu tekstūru | bd884a96 |  |
| c20.because | With an event coming up, a big change now leaves little time to settle into it. | Tā kā tuvojas pasākums, krasas pārmaiņas šobrīd atstāj maz laika, lai pie tām pierastu. | 75d81a12 |  |
| c20-b.because | With an event coming up, a very short fringe leaves little time to settle into it. | Tā kā tuvojas pasākums, ļoti īsi priekšmati atstāj maz laika, lai pie tiem pierastu. | 3378e810 |  |
| d01.reason | You wear a beard | Tev ir bārda | ca40bb1c |  |
| d01-full-beard.reason | You wear a full beard | Tev ir pilnbārda | 3e023aa2 |  |
| d09.reason | You wear a beard and prefer a short top | Tev ir bārda un dod priekšroku īsiem matiem augšdaļā | 81cd4d71 |  |
| d10.reason | You wear glasses every day and are open to a fringe | Ikdienā nēsā brilles un esi atvērts priekšmatiem | ac69ef2a |  |
| d11-b.because | Glasses arms rest at ear height, so lighter, tidier hair there stops them pushing the sides out. | Briļļu kājiņas atrodas ausu augstumā, tāpēc vieglāki un sakoptāki mati šajā zonā neļauj tām izspiest matus sānos. | 9378d509 |  |
| d12.reason | Bold frames already add width at the eyes | Izteiksmīgi briļļu rāmji jau paši par sevi piešķir platumu acu zonā | 0b5c13a1 |  |
| d14.reason | The back of your head is fairly flat | Tev ir diezgan plakans pakausis | 04a149de |  |
| d15.reason | The back of your head is clearly rounded | Tev ir izteikti apaļš pakausis | 6868e1a1 |  |
| d17.reason | You would like more shape on top | Vēlies izteiksmīgāku formu matu augšdaļā | 1f3f8a10 |  |
| d18.reason | You prefer some cover over the scalp | Dod priekšroku tam, lai galvas āda būtu piesegta | 385cec8e |  |
| scars-scalp-shows.because | You want marks on your scalp covered. So cuts with any part shorter than 10 mm, a number 3 guard, are left out. | Tu vēlies nosegt rētiņas vai citas iezīmes uz galvas ādas, tāpēc griezumi, kuros kāda daļa ir īsāka par 10 mm (3. mašīnītes uzgalis), ir izlaisti. | f2b04ae0 |  |
| scars-thin-hair.because | You want marks on your scalp covered, and your scalp shows easily. So cuts with any part under 1.5 cm are left out. | Tu vēlies nosegt rētiņas vai citas iezīmes uz galvas ādas, un galvas āda tev viegli spīd cauri, tāpēc griezumi, kuros kāda daļa ir īsāka par 1,5 cm, ir izlaisti. | 48598fbf |  |
| d19.because | You asked for a sharp line-up. Your hairline sits higher at the temples, so a softer line-up that follows it is kinder. It avoids pushing the hairline back with every cut. | Tu vēlējies asu line-up. Tava matu augšanas līnija deniņos ir augstāka, tāpēc maigāks line-up, kas seko tās formai, būs saudzīgāks. Tas palīdzēs neatbīdīt matu augšanas līniju tālāk ar katru griezumu. | d018089f |  |
| fringe-avoid.because | You said no fringe, so cuts with a fringe are left out. | Tu norādīji, ka nevēlies priekšmatus, tāpēc griezumi ar priekšmatiem netiek rādīti. | fb265c35 |  |
| fringe-want.because | You said you would like a fringe, so cuts without one are left out. | Tu norādīji, ka vēlies priekšmatus, tāpēc griezumi bez tiem ir izlaisti. | e420e448 |  |
| wash-and-go-no-daily-shaping.because | You want wash and go. So cuts your hair type needs shaped each day, with a pick, a product or a blow-dry, are left out. | Tu vēlies «izmazgā un ej» griezumu, tāpēc griezumi, kas tavam matu tipam katru dienu jāieveido ar ķemmi, ieveidošanas līdzekli vai fēnu, ir izlaisti. | bed7406c |  |
| side-fullness-not-close.because | You would like fullness at the sides, so cuts with close sides are left out. | Tu vēlies apjomu sānos, tāpēc griezumi ar ļoti īsiem sāniem ir izlaisti. | 6916d427 |  |
| top-length-very-short.reason | You would like a very short top | Vēlies ļoti īsus matus augšdaļā | 7932e62f |  |
| top-length-short.reason | You would like a short top | Vēlies īsus matus augšdaļā | 3fcb1cde |  |
| top-length-medium.reason | You would like a top of medium length | Vēlies vidēja garuma matus augšdaļā | 137246af |  |
| top-length-long.reason | You would like a long top | Vēlies garus matus augšdaļā | 7c672af2 |  |
| top-length-very-short-only.because | You asked for a clipper-length top, so cuts whose top is longer than 2 cm are left out. | Tu vēlējies ar mašīnīti grieztu augšpusi, tāpēc griezumi, kuru augšdaļa ir garāka par 2 cm, ir izlaisti. | 0b3923ff |  |
| top-length-short-only.because | You asked for a top shorter than a finger, so cuts whose top is longer than 5 cm are left out. | Tu vēlējies augšpusi, kas ir īsāka par pirksta garumu, tāpēc griezumi, kuru augšdaļa ir garāka par 5 cm, ir izlaisti. | 6985a70e |  |
| top-length-short-not-clipper.because | You asked for a top shorter than a finger. So clipper-short tops, under 2 cm, are left out. | Tu vēlējies augšpusi, kas ir īsāka par pirksta garumu, tāpēc griezumi ar mašīnītes garuma augšpusi (zem 2 cm) ir izlaisti. | 6c08163a |  |
| top-length-medium-only.because | You asked for a top about a finger long, so cuts whose top is under 5 cm are left out. | Tu vēlējies augšpusi apmēram pirksta garumā, tāpēc griezumi, kur mati augšpusē ir īsāki par 5 cm, ir izlaisti. | a52fbc44 |  |
| top-length-medium-not-long.because | You asked for a top about a finger long, so cuts whose top is longer than 10 cm are left out. | Tu vēlējies augšpusi apmēram pirksta garumā, tāpēc griezumi, kur mati augšpusē ir garāki par 10 cm, ir izlaisti. | d085c7b9 |  |
| top-length-long-only.because | You asked for a top longer than a finger, so cuts whose top is under 10 cm are left out. | Tu vēlējies augšpusi garāku par pirkstu, tāpēc griezumi, kur mati augšpusē ir īsāki par 10 cm, ir izlaisti. | c70ca85b |  |
| taste-shape.reason | You tapped looks you like | Tu atzīmēji tēlus, kas tev patīk | 4acf6c12 |  |
| taste-length.reason | You tapped looks you like | Tu atzīmēji tēlus, kas tev patīk | 4acf6c12 |  |
| taste-fringe.reason | You tapped looks you like | Tu atzīmēji tēlus, kas tev patīk | 4acf6c12 |  |
| taste-height.reason | You tapped looks you like | Tu atzīmēji tēlus, kas tev patīk | 4acf6c12 |  |
| lift-0-2-virgin.because | A small step lighter on natural, healthy hair is well within reach of normal colour. | Nedaudz gaišāku toni dabiskos, veselīgos matos var viegli panākt ar parasto matu krāsu. | 9c2c2a8a | safety; checked |
| lift-0-2-virgin.what_to_ask | Ask for a strand test to confirm the result on your hair before the first appointment. | Pirms pirmās vizītes palūdz veikt šķipsnas testu, lai pārliecinātos par rezultātu tieši savos matos. | e51a8aae | safety; checked |
| lift-3-4-any.because | Going a good deal lighter depends on your hair and its history, which a colourist needs to see. | Pāreja uz ievērojami gaišāku toni ir atkarīga no taviem matiem un to vēstures, kas koloristam ir jānovērtē pašam. | 10051bc4 | safety; checked |
| lift-3-4-any.what_to_ask | Ask whether this lift is realistic for hair like yours, and for a strand test first. | Pajautā, vai šāda gaišināšana ir reāla tādiem matiem kā tavējie, un vispirms palūdz šķipsnas testu. | 5d21555e | safety; checked |
| lift-5-plus-any.because | Going much lighter is a big change that a colourist needs to plan and watch over. | Pāreja uz daudz gaišāku toni ir liela pārmaiņa, kas koloristam ir jāplāno un jāuzrauga. | 614bbb91 | safety; checked |
| lift-5-plus-any.what_to_ask | Ask how they would keep your hair in good shape through the lightening, and what result is likely. | Pajautā, kā kolorists saglabātu matus labā stāvoklī gaišināšanas laikā un kāds rezultāts ir sagaidāms. | 21049145 | safety; checked |
| very-dark-to-platinum.because | Lifting dark or medium-brown hair to the palest blondes passes through strong warm stages. It also puts the most strain on the hair. | Gaišinot tumšus vai vidēji brūnus matus līdz visgaišākajam blondajam tonim, mati iziet cauri izteikti siltiem starptoņiem. Turklāt matiem tā ir vislielākā slodze. | 24847f09 | safety; checked |
| very-dark-to-platinum.what_to_ask | Ask what the hair will look like on the way and how they will keep it in good condition. | Pajautā, kā mati izskatīsies pārejas posmā un kā kolorists tos saglabās labā stāvoklī. | 849518ec | safety; checked |
| mid-brown-to-light-blonde.because | From brown or dark blonde, a light blonde is reachable for some people, but warm tones often show on the way. | Pārejot no brūniem vai tumši blondiem matiem, gaiši blondu toni daļai cilvēku ir iespējams sasniegt, taču procesā bieži parādās siltie toņi. | 16907478 | safety; checked |
| mid-brown-to-light-blonde.what_to_ask | Ask how much warmth to expect and whether a softer blonde would suit your starting point. | Pajautā, ar cik siltu toni jārēķinās un vai tavam izejas tonim piestāvētu maigāks blondais tonis. | 15077e52 | safety; checked |
| go-lighter-over-dye.because | Dye cannot lighten dye. So a colourist first takes the old colour out, then puts the new shade on. | Krāsa nevar padarīt gaišāku citu krāsu. Tāpēc kolorists vispirms izņem veco krāsu un tikai tad uzklāj jauno toni. | 57c0e92d | safety; checked |
| go-lighter-over-dye.what_to_ask | Ask how they would lighten or remove the old colour and what condition your hair needs to be in first. | Pajautā, kā kolorists plāno matus padarīt gaišākus vai noņemt veco krāsu un kādā stāvoklī taviem matiem vispirms jābūt. | d730ac78 | safety; checked |
| box-black-to-lighter.because | Dark box dye builds up in the lengths, so going lighter from it needs a colourist's plan. | Tumšā veikala krāsa uzkrājas matu garumā, tāpēc, lai pēc tās iegūtu gaišāku toni, ir vajadzīgs kolorista plāns. | 2b655a95 | safety; checked |
| box-black-to-lighter.what_to_ask | Ask about a strand test and how a lift from dyed dark hair usually goes for hair like yours. | Pajautā par šķipsnas testu un to, kā tādiem matiem kā tavējie parasti norit krāsotu tumšu matu gaišināšana. | ead94efc | safety; checked |
| colour-correction-tone.because | You can often change the tone of dyed hair without going lighter. Old colour can take it unevenly. | Krāsotu matu toni bieži vien var mainīt, nepadarot matus gaišākus. Tomēr iepriekš krāsotie mati jauno toni var uzņemt nevienmērīgi. | 55b0d2a0 | safety; checked |
| colour-correction-tone.what_to_ask | Ask for a strand test on the coloured lengths and which tone is realistic. | Palūdz veikt šķipsnas testu krāsotajos matu garumos un noskaidro, kāds tonis ir reāli sasniedzams. | 05afc700 | safety; checked |
| colour-correction-any.because | A colour correction is planned case by case once a colourist has seen your hair. | Krāsas korekciju plāno individuāli, kad kolorists ir novērtējis tavus matus. | ec742408 | safety; checked |
| colour-correction-any.what_to_ask | Ask to be seen in person first, for a strand test and for what result is realistic for your hair. | Vispirms piesakies uz klātienes konsultāciju un šķipsnas testu, kā arī noskaidro, kāds rezultāts taviem matiem ir reāli iespējams. | 64defe3e | safety; checked |
| henna-plant.because | Plant henna stays in the hair and lightens unevenly and warm. Products sold as henna are not always pure. Lightening over it should be strand tested and done by a colourist. | Augu henna paliek matos, un gaišināšana norit nevienmērīgi un ar siltu toni. Produkti, ko pārdod kā hennu, ne vienmēr ir ar tīru sastāvu. Gaišināšanai pēc hennas nepieciešams veikt šķipsnas testu, un tā jāuztic koloristam. | 0da77268 | safety; checked |
| henna-plant.what_to_ask | Bring the henna product name if you can and say when you last used it. Ask for a strand test before any lightening. | Ja vari, paņem līdzi hennas produkta nosaukumu un pastāsti, kad to lietoji pēdējo reizi. Pirms jebkādas gaišināšanas palūdz veikt šķipsnas testu. | 18625724 | safety; checked |
| henna-plant-ash.because | Plant henna leaves a red-orange base that makes cool ash tones hard to reach. | Augu henna atstāj sarkanīgi oranžu bāzi, tāpēc vēsos pelnu toņus ir grūti iegūt. | 3267dda0 | safety; checked |
| henna-plant-ash.what_to_ask | Tell your colourist about the henna and ask which tones can work over it. | Pastāsti koloristam par hennu un pajautā, kādus toņus var krāsot tai pāri. | c4d39c11 | safety; checked |
| henna-plant-any.because | Plant henna stays in the hair and changes how any colour over it turns out. | Augu henna paliek matos un maina to, kā izdosies jebkura krāsa, ko krāsos tai pāri. | dd40b783 | safety; checked |
| henna-plant-any.what_to_ask | Tell your colourist about the henna and bring the product name if you can. Ask for a strand test before any colour. | Pastāsti koloristam par hennu un, ja vari, paņem līdzi produkta nosaukumu. Pirms jebkādas krāsošanas palūdz veikt šķipsnas testu. | 75bd60bb | safety; checked |
| metallic-salts.because | Some henna and products that darken hair have metal salts in them. These can react badly with salon colour and lightener. | Daži hennas veidi un matus tumšinoši līdzekļi satur metālu sāļus. Tie var slikti reaģēt ar salona krāsu un gaišinātāju. | 8c55f74e | safety; checked |
| metallic-salts.what_to_ask | Bring the product name if you can, and ask for a strand test before any colour. | Ja vari, paņem līdzi produkta nosaukumu un pirms jebkādas krāsošanas palūdz veikt šķipsnas testu. | 4e2805b4 | safety; checked |
| go-darker-modest.because | Going one to three levels darker on hair in fair condition is often simple. | Nokrāsot matus par vienu līdz trim toņiem tumšākus, ja tie ir apmierinošā stāvoklī, bieži vien ir vienkārši. | 34826368 | safety; checked |
| go-darker-modest.what_to_ask | Ask how the darker colour will fade and how often the roots will need a refresh. | Pajautā, kā tumšākā krāsa izmazgāsies un cik bieži būs jāpiekrāso saknes. | 2eab8b78 | safety; checked |
| go-darker-over-lightened.because | Hair that has been lightened or had colour removed is porous. A darker shade can take unevenly, look flat or fade fast. | Mati, kas ir gaišināti vai no kuriem noņemta krāsa, ir poraini. Tumšāks tonis var iekrāsoties nevienmērīgi, izskatīties plakans vai ātri izmazgāties. | 8f3b6051 | safety; checked |
| go-darker-over-lightened.what_to_ask | Ask whether your hair needs a pre-colour (filler) step first and how the darker shade will fade. | Pajautā, vai taviem matiem vispirms ir vajadzīga priekškrāsošana (filleris) un kā tumšākais tonis izmazgāsies. | d7b3c41f | safety; checked |
| go-darker-from-bleached.because | Very light hair can take a dark colour unevenly or look flat unless lost warmth is put back first. | Ļoti gaišos matos tumša krāsa var iekrāsoties nevienmērīgi vai izskatīties plakana, ja vien vispirms netiek atjaunots zaudētais siltums. | 16fb0f75 | safety; checked |
| go-darker-from-bleached.what_to_ask | Ask whether your hair needs a pre-colour step and how the darker shade will fade. | Pajautā, vai taviem matiem vispirms ir vajadzīga priekškrāsošana un kā tumšākais tonis izmazgāsies. | d4f35334 | safety; checked |
| filler-before-dark.because | Very light lengths need a filler before a much darker shade. Without it the colour can turn green, flat or patchy. | Ļoti gaišiem matu garumiem pirms daudz tumšāka toņa ir vajadzīgs filleris. Bez tā krāsa var kļūt zaļgana, nedzīva vai pleķaina. | 5b2f6df1 | safety; checked |
| filler-before-dark.what_to_ask | Ask your colourist to fill your lengths before the darker colour. | Palūdz savam koloristam piepildīt matu garumus ar pigmentu pirms tumšāka toņa krāsošanas. | fd836ec4 | safety; checked |
| vivid-on-dark.because | Bright shades need the hair lightened first, and on darker hair that step needs a colourist's plan. | Košiem toņiem mati vispirms ir jāgaišina, un tumšākiem matiem šim solim vajadzīgs kolorista plāns. | 493784ab | safety; checked |
| vivid-on-dark.what_to_ask | Ask how light the hair must go for this shade and how they will keep it in good condition. | Pajautā, cik gaišiem jābūt matiem šim tonim un kā kolorists parūpēsies par to labo stāvokli. | 846c76c5 | safety; checked |
| grey-coverage-percent.because | Covering grey with a shade near your natural colour is a common salon job. | Sirmo matu nokrāsošana tonī, kas ir tuvs tavam dabiskajam, ir ierasta salona procedūra. | 18bb669c | safety; checked |
| grey-coverage-percent.what_to_ask | Ask how often the roots will need covering and whether a softer blend would suit you. | Pajautā, cik bieži būs jāpiekrāso saknes un vai tev piestāvētu maigāka sirmo matu iepludināšana. | c39566c0 | safety; checked |
| grey-blending-percent.because | Blending grey with lights and lowlights near your natural colour is a gentle, easy choice. | Sirmo matu iepludināšana ar gaišākām un tumšākām šķipsnām tuvu tavam dabiskajam tonim ir maiga un viegla izvēle. | dde5dc9b | safety; checked |
| grey-blending-percent.what_to_ask | Ask how the blend will grow out and when it will need a refresh. | Pajautā, kā iepludinātie toņi ataugs un kad tos vajadzēs atjaunot. | 0259e806 | safety; checked |
| grey-blending-damaged.because | Damaged hair can turn patchy with blending colour. A colourist should check it first, even with no lightening. | Bojāti mati, iepludinot krāsu, var nokrāsoties pleķaini. Koloristam tie vispirms būtu jānovērtē, pat bez gaišināšanas. | 587cdba9 | safety; checked |
| grey-blending-damaged.what_to_ask | Ask if your hair is ready for blending colour now, or if a few weeks of care first would give an even result. | Pajautā, vai tavi mati ir gatavi krāsas iepludināšanai jau tagad, vai arī dažu nedēļu kopšana pirms tam dotu vienmērīgu rezultātu. | d6dfb903 | safety; checked |
| grey-to-silver.because | An even silver or grey depends on how much grey you have and how light the rest of your hair can safely go. It can mean a long grow-out or regular toning. | Vienmērīgs sudraba vai pelēkais tonis ir atkarīgs no tā, cik daudz sirmo matu tev ir un cik gaišus var droši padarīt pārējos matus. Tas var nozīmēt ilgu ataugšanas periodu vai regulāru tonēšanu. | f13bf44b | safety; checked |
| grey-to-silver.what_to_ask | Ask whether to blend while you grow it out or to lighten the rest, and what each means for your hair. | Pajautā, vai ataugšanas laikā iepludināt sirmos matus vai gaišināt pārējos, un ko katrs variants nozīmē taviem matiem. | 155dbf2c | safety; checked |
| lightener-on-straightened.because | Relaxed, permed or smoothed hair has already been changed by chemicals. Lightening it needs a colourist's care. | Ķīmiski taisnoti, ilgviļņoti vai nogludināti mati jau ir ķīmiski apstrādāti. To gaišināšanai nepieciešama kolorista rūpība. | 37360b53 | safety; checked |
| lightener-on-straightened.what_to_ask | Tell your colourist when and how your hair was straightened, and ask for a strand test. | Pastāsti koloristam, kad un kā tavi mati tika taisnoti, un palūdz veikt šķipsnas testu. | 5e759f9c | safety; checked |
| colour-soon-after-chemical.because | Hair needs a break after a perm, relaxer or smoothing treatment. Wait at least two weeks before more chemical work. | Pēc ilgviļņiem, ķīmiskās taisnošanas vai nogludinošām procedūrām matiem ir nepieciešama atpūta. Nogaidi vismaz divas nedēļas pirms nākamās ķīmiskās apstrādes. | 8234a0bd | safety; checked |
| colour-soon-after-chemical.what_to_ask | Ask your colourist when it is safe to colour after your last chemical service. | Pajautā savam koloristam, kad pēc pēdējās ķīmiskās procedūras ir droši krāsot matus. | fd22b852 | safety; checked |
| colour-soon-after-dye.because | Colour put on in the last two weeks is still settling, so a colourist should look at your hair first. | Pēdējo divu nedēļu laikā ieklātā krāsa vēl nostiprinās, tāpēc koloristam vispirms vajadzētu novērtēt tavus matus. | c752055d | safety; checked |
| colour-soon-after-dye.what_to_ask | Ask your colourist to look at your hair before more colour goes on. | Pirms jaunas krāsas uzklāšanas palūdz koloristam apskatīt tavus matus. | 73cf90d0 | safety; checked |
| damaged-hair.because | Lightening hair that already breaks or feels gummy can harm it further. | Gaišināt matus, kas jau lūst vai stiepjas kā gumija, var tiem nodarīt vēl lielāku kaitējumu. | 1af51aba | safety; checked |
| damaged-hair.what_to_ask | Ask about care and trims first, and when your hair will be ready for lightening. | Vispirms pajautā par kopšanu un matu galu apgriešanu, kā arī par to, kad mati būs gatavi gaišināšanai. | c0503165 | safety; checked |
| scalp-skin-problem.because | Colour should not go on a scalp that is sore, irritated, sunburnt or broken. | Matu krāsu nedrīkst klāt uz galvas ādas, kas ir sāpīga, sakairināta, saulē apdegusi vai bojāta. | f47c9c9b | safety; checked |
| scalp-skin-problem.what_to_ask | Wait until your scalp has healed, and ask your colourist to check it before colouring. | Nogaidi, līdz galvas āda ir sadzijusi, un pirms krāsošanas palūdz koloristam to pārbaudīt. | a191baac | safety; checked |
| pregnancy-treatment.because | If you are pregnant, breastfeeding or having treatment for your health, talk to a colourist. They should plan any colour with you. | Ja esi stāvoklī, baro bērnu ar krūti vai ārstējies, aprunājies ar koloristu. Jebkura krāsošana ir jāplāno kopā ar viņu. | 3c3817ae | safety; checked |
| pregnancy-treatment.what_to_ask | Tell your colourist, and ask your doctor if you are unsure. | Pastāsti par to koloristam un, ja šaubies, konsultējies ar savu ārstu. | 1c6788a1 | safety; checked |
| ash-from-warm-base.because | Lifting warm hair passes through red and orange, so cool ash tones can be hard to reach and keep. | Gaišinot siltu matu toni, tas iziet cauri sarkanajam un oranžajam pigmentam, tāpēc vēsos pelnu toņus var būt grūti iegūt un noturēt. | 3711b0a5 | safety; checked |
| ash-from-warm-base.what_to_ask | Ask how cool the result can be from your current colour and how often it will need toning. | Pajautā, cik vēsu toni iespējams iegūt no tavas pašreizējās matu krāsas un cik bieži to vajadzēs tonēt. | bcf1e753 | safety; checked |
| red-copper-fade.because | Red and copper shades fade quickly, so they need more upkeep than you said suits you. | Rudie un vara toņi ātri izmazgājas, tāpēc to uzturēšanai būs vajadzīgs vairāk rūpju, nekā norādīji kā sev piemērotu. | cf94cc32 | safety; checked |
| red-copper-fade.what_to_ask | Ask how fast this shade fades on your hair and what care slows it down. | Pajautā, cik ātri šis tonis izbalē tavos matos un kāda kopšana palēnina izbalēšanu. | a276aa65 | safety; checked |
| textured-hair-lightening.because | Lightening can loosen curls and coils and dry the hair, so a bigger lift needs extra care. | Gaišināšana var atslābināt cirtas un sīkās lokas un sausināt matus, tāpēc spēcīgākai gaišināšanai nepieciešama papildu piesardzība. | d46b5871 | safety; checked |
| textured-hair-lightening.what_to_ask | Ask a colourist who works with curls how they would protect your pattern. | Pajautā koloristam, kurš strādā ar cirtainiem matiem, kā viņš pasargātu tavu cirtu struktūru. | 20695cce | safety; checked |
| textured-hair-lightening-fine.because | Fine strands take lightener quickly and can weaken with a bigger lift. | Smalki mati gaišinātāju uzņem ātri un spēcīgākas gaišināšanas dēļ var novājināties. | 19dea129 | safety; checked |
| textured-hair-lightening-fine.what_to_ask | Ask how they would protect fine hair and whether a softer lift would suit it. | Pajautā, kā kolorists pasargātu smalkus matus un vai tiem būtu piemērota maigāka gaišināšana. | ee33033c | safety; checked |
| unknown-history.because | Without knowing what your hair has had before, nobody can say how colour will behave on it. | Nezinot, kas ar taviem matiem darīts iepriekš, neviens nevar pateikt, kā tajos uzvedīsies krāsa. | bbf45ea2 | safety; checked |
| unknown-history.what_to_ask | Tell your colourist everything your hair has had in the last two to three years, and ask for a strand test. | Pastāsti koloristam par visu, kas taviem matiem darīts pēdējos divos līdz trijos gados, un palūdz veikt šķipsnas testu. | bee27767 | safety; checked |
| unknown-current-level.because | Without the colour of your lengths today, the change this look needs cannot be judged. | Nezinot, kādā krāsā šodien ir tavi mati garumos, nav iespējams novērtēt, kādas pārmaiņas nepieciešamas šim tēlam. | cec9762b | safety; checked |
| unknown-current-level.what_to_ask | Ask your colourist to judge how light or dark your lengths are now. | Palūdz savam koloristam novērtēt, cik gaiši vai tumši pašlaik ir tavi mati garumos. | f96ecfad | safety; checked |
| deposit-only-lift.because | A gloss or demi cannot supply the lightening this look requires. | Gloss vai demi-permanentā krāsa nespēj nodrošināt šim tēlam nepieciešamo gaišināšanu. | 9a280f2f | safety; checked |
| deposit-only-lift.what_to_ask | Ask whether this look needs a lightening step on your hair, or a shade closer to your own. | Pajautā, vai šim tēlam ir vajadzīga matu gaišināšana, vai arī tonis, kas ir tuvāks tavējam. | 9b18b2cc | safety; checked |
| lightening-placement-not-lighter.because | The lighter pieces in this look are no lighter than your hair is now, so they would not show as intended. | Šī tēla gaišākās šķipsnas nav gaišākas par tavu pašreizējo matu krāsu, tāpēc tās neizceltos tā, kā iecerēts. | e6fdc507 | safety; checked |
| lightening-placement-not-lighter.what_to_ask | Ask your colourist which shade would show as lighter on your current colour. | Pajautā koloristam, kāds tonis uz tavas pašreizējās matu krāsas fona izskatītos gaišāks. | 515d4fb0 | safety; checked |
| patch-test.text | Always do the allergy skin test that the colour maker and your colourist say you need. Do it even if you have used the colour before. Tell them if you have ever had a black henna tattoo. | Vienmēr veic ādas alerģijas testu, ko krāsas ražotājs un tavs kolorists norāda kā nepieciešamu. Veic to pat tad, ja šo krāsu jau esi lietojis iepriekš. Pasaki savam koloristam, ja tev kādreiz ir bijis melnās hennas tetovējums. | 7bb533b8 | safety; checked |
| strand-test.text | Ask for a strand test before any lightening, so you and your colourist can see how your hair takes it. | Pirms jebkādas gaišināšanas palūdz veikt šķipsnas testu, lai tu un tavs kolorists redzētu, kā mati reaģē. | 959a56ef | safety; checked |
| session-count-policy.text | Nobody can promise how many visits a colour change will take. Your colourist judges it as they go. | Neviens nevar apsolīt, cik vizīšu prasīs matu krāsas maiņa. Tavs kolorists to izvērtē procesa gaitā. | fa5d162b | safety; checked |
| black-henna-reaction.text | You told us hair dye or black henna has made your skin react before. Please ask a doctor or allergy clinic before you colour your hair. Do not test hair colour on your skin yourself. | Tu norādīji, ka matu krāsa vai melnā henna tev iepriekš ir izraisījusi ādas reakciju. Pirms krāso matus, lūdzu, konsultējies ar ārstu vai alergologu. Nepārbaudi matu krāsu uz ādas pats. | 8803a11d | safety; checked |
| black-henna-tattoo.text | A black henna tattoo can make a reaction to hair dye more likely. Please ask a doctor or allergy clinic before you colour your hair. | Melnās hennas tetovējums var palielināt reakcijas risku uz matu krāsu. Pirms matu krāsošanas, lūdzu, konsultējies ar ārstu vai alergologu. | 2be26135 | safety; checked |
| henna-compound.text | Some henna and hair darkeners hold metal salts. These can react with salon colour and bleach. Please ask a colourist for a strand test before any colour. | Daži hennas veidi un matu tumšinātāji satur metālu sāļus. Tie var reaģēt ar salona matu krāsu un balinātāju. Pirms jebkādas krāsošanas, lūdzu, palūdz koloristam veikt šķipsnas testu. | 1d562204 | safety; checked |
| henna-compound-type.text | Some henna and hair darkeners hold metal salts. These can react with salon colour and bleach. Please ask a colourist for a strand test before any colour. | Daži hennas veidi un matu tumšinātāji satur metālu sāļus. Tie var reaģēt ar salona matu krāsu un balinātāju. Pirms jebkādas krāsošanas, lūdzu, palūdz koloristam veikt šķipsnas testu. | 1d562204 | safety; checked |
| henna-type-unknown.text | You told us there is henna on your hair, but not which kind. Some henna and hair darkeners hold metal salts. These can react with salon colour and bleach. Please ask a colourist for a strand test before any colour. | Tu norādīji, ka tavos matos ir henna, bet neprecizēji, kāda tieši. Daži hennas veidi un matu tumšinātāji satur metālu sāļus. Tie var reaģēt ar salona matu krāsu un balinātāju. Pirms jebkādas krāsošanas, lūdzu, palūdz koloristam veikt šķipsnas testu. | b1d1b428 | safety; checked |
| scalp-sore-now.text | Your scalp is sore or broken now, and colour can make that worse. Wait until it heals, then ask a colourist. | Tava galvas āda šobrīd ir sāpīga vai bojāta, un krāsa to var pasliktināt. Pagaidi, līdz tā sadzīst, un tad konsultējies ar koloristu. | 762b6156 | safety; checked |

## Removed

| id | English | Latvian | source | notes |
| --- | --- | --- | --- | --- |
| natural-no-lifting-away.because | You asked for your natural colour, so looks that make your hair much lighter than it are left out. | Tu vēlējies savu dabisko matu krāsu, tāpēc varianti, kas padara matus daudz gaišākus par tavu dabisko toni, netiek iekļauti. | cb3c0a0e |  |
| grey-goal-no-coverage.because | You want to blend, keep or lift your grey, so full grey cover is left out. | Tu vēlies sirmos matus sapludināt, saglabāt vai izcelt, tāpēc pilnīga sirmo matu nosegšana netiek iekļauta. | 2e876ecc |  |
| grey-goal-no-all-over.because | You want to blend or keep your grey, so colour all over, which covers it, is left out. | Tu vēlies sirmos matus sapludināt vai saglabāt, tāpēc matu krāsošana visā garumā, kas tos nosegtu, netiek iekļauta. | de23ee15 |  |
| grey-goal-cover-not-silver.because | You want your grey covered, so silver looks are left out. | Tu vēlies nosegt sirmos matus, tāpēc sudrabotie toņi netiek iekļauti. | 04f47c09 |  |
| scars-sides-show.because | You want marks on your scalp kept covered, so cuts with very short sides are left out. | Tu vēlies, lai rētas un citas zīmes uz galvas ādas paliktu piesegtas, tāpēc griezumi ar ļoti īsiem sāniem netiek iekļauti. | 73627e69 |  |
| scars-buzz-shows.because | You want marks on your scalp kept covered, so clipper cuts all over are left out. | Tu vēlies, lai rētas un citas zīmes uz galvas ādas paliktu piesegtas, tāpēc griezumi ar mašīnīti visai galvai netiek iekļauti. | ea5a19da |  |
| consult.questions.showAll | Show all | Rādīt visus | 2150d8df |  |
| consult.questions.showFewer | Show fewer | Rādīt mazāk | 255beb65 |  |
| ideas.shortfall.unmetCut.texture | Your hair texture | Tava matu tekstūra | bbf370ee |  |
| ideas.shortfall.unmetCut.hair_type | Your hair type | Tavs matu tips | bf912d09 |  |
| ideas.shortfall.unmetCut.density | How much hair you have | Cik biezi ir tavi mati | a53e9722 |  |
| ideas.shortfall.unmetCut.reach | A length you can reach in a reasonable time | Garums, ko vari sasniegt saprātīgā laikā | 9e0a4dac |  |
| ideas.shortfall.unmetCut.event | Being ready for your event | Gatavība tavam pasākumam | 11e882cd |  |
| ideas.shortfall.unmetCut.tie_back | Your need to tie your hair back | Vajadzība saņemt matus | 7d63d477 |  |
| ideas.shortfall.unmetCut.big_chop | Your wish for a subtle change | Vēlme pēc neuzkrītošām pārmaiņām | 6c5bfda9 |  |
| ideas.worthAsking.why.grey_route | It is not a technique made for grey. Ask a colourist if it would do what you want for your grey. | Šī tehnika nav radīta sirmiem matiem. Pajautā koloristam, vai ar to varēs panākt to, ko vēlies saviem sirmajiem matiem. | 92c699a0 |  |
| colour-henna-type.options.tattoo.label | Black henna temporary tattoo | Melnās hennas pagaidu tetovējums | 28391569 |  |
| upkeep.prompt | How much time and how many salon visits suit you? | Cik daudz laika un cik bieži salona apmeklējumi tev der? | db6e9445 |  |
| upkeep.options.life.styling_minutes=5,life.trim_weeks_ok=12.label | Wash and go, a trim every 3 months | Izmazgā un ej, aplīdzināšana ik pēc 3 mēnešiem | 7a4562e3 |  |
| upkeep.options.life.styling_minutes=5,life.trim_weeks_ok=3.label | Quick to style, a cut every 2-4 weeks | Ātra ieveidošana, griezums ik pēc 2–4 nedēļām | 9241549c |  |
| upkeep.options.life.styling_minutes=10,life.trim_weeks_ok=8.label | About 10 minutes, a trim every 6-8 weeks | Ap 10 minūtēm, aplīdzināšana ik pēc 6–8 nedēļām | c6bbf487 |  |
| upkeep.options.life.styling_minutes=20,life.trim_weeks_ok=5.label | Up to 20 minutes, a trim every 4-6 weeks | Līdz 20 minūtēm, aplīdzināšana ik pēc 4–6 nedēļām | 60832eea |  |
| upkeep.options.life.styling_minutes=30,life.trim_weeks_ok=3,life.enjoys_styling=true.label | I enjoy styling, trims as often as needed | Patīk ieveidot matus, aplīdzināšana tik bieži, cik vajag | 65889f0a |  |
| upkeep.options.null.label | Not sure | Grūti pateikt | dca5fa43 |  |
| d05.because | You would like more presence at the chin, so a fuller beard shape there adds the weight you are looking for. | Tu vēlies lielāku akcentu uz zodu, tāpēc kuplāka bārda pie zoda piešķir tieši tādu apjomu, kādu meklē. | 60a0d935 |  |
| a07.reason | You would like a little more open space across the forehead | Vēlies nedaudz vairāk atvērt pieres zonu | f2cf0b5d |  |
| a10.reason | You would like to draw attention to your jaw line | Vēlies pievērst uzmanību žokļa līnijai | 1b2682f3 |  |
| a11.reason | You would like to balance the top and bottom of your face | Vēlies līdzsvarot sejas augšdaļu un apakšdaļu | dd2cb7a4 |  |
| a25.reason | You would like to balance the width of your face, and an off-centre part helps | Vēlies līdzsvarot sejas platumu, un celiņš nedaudz uz sānu tam palīdz | 6bbe67f1 |  |
| texture-poor-fit.reason | This shape works against your hair texture | Šī forma īsti nesader ar tavu matu tekstūru | 23f3d1b7 |  |
| c01.reason | You have only a few minutes for your hair each morning | Katru rītu matiem vari veltīt tikai dažas minūtes | a7c260eb |  |
| c02.reason | You have a few minutes in the morning | No rītiem vari veltīt dažas minūtes | cca17137 |  |
| c04.reason | You prefer longer gaps between visits | Dod priekšroku retākiem salona apmeklējumiem | 73541fa3 |  |
| c09-short.because | Too short to tie back, but at this length it stays out of your way. | Pārāk īsi, lai saņemtu astē, taču šādā garumā tie netraucē. | a0f38d9f |  |
| c15.reason | You would like a gentle change | Vēlies nelielas pārmaiņas | cc1a26f0 |  |
| c16.reason | You are ready for something new | Esi gatavs kaut kam jaunam | ac5d9470 |  |
| c15-large-change.reason | This is a bigger change in length than you asked for | Šīs ir lielākas garuma pārmaiņas, nekā vēlējies | ebbd7166 |  |
| c15-large-change-default.reason | This is a big change in length, and you have not said you want that | Šīs ir lielas garuma pārmaiņas, un tu neesi norādījis, ka tādas vēlies | 36745af5 |  |
| growth-over-26-weeks.reason | This length is a long way from your hair now | Šis garums ir tālu no tava pašreizējā matu garuma | 87a85e07 |  |
| black-henna-reaction-tattoo.text | A black henna tattoo can make a reaction to hair dye more likely. Please ask a doctor or allergy clinic before you colour your hair. | Melnās hennas tetovējums var palielināt reakcijas risku uz matu krāsu. Pirms matu krāsošanas, lūdzu, konsultējies ar ārstu vai alergologu. | 2be26135 | safety; checked |
