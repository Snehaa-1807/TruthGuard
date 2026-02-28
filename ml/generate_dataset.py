"""
TruthGuard - Comprehensive Dataset Generator v3
Covers 4 fake news styles:
  1. Sensationalist (BREAKING!!!, ALL CAPS)
  2. Calm medical misinformation (your banana example)
  3. Pseudoscience / health hoax
  4. Political misinformation
Real news covers:
  1. Medical/science research
  2. Economics/finance
  3. Politics/policy
  4. Environment/tech
"""
import random, csv, os
random.seed(42)

# ══════════════════════════════════════════════════════════════════════════════
# FAKE CATEGORY 1: Sensationalist (ALL CAPS, !!!)
# ══════════════════════════════════════════════════════════════════════════════
SENS_CLAIMS = [
    "vaccines contain microchips to track the population",
    "5G towers are spreading the coronavirus deliberately",
    "the moon landing was staged in a Hollywood studio",
    "COVID-19 was engineered as a bioweapon by globalist elites",
    "chemtrails are being used to poison and sterilize the population",
    "cancer has been cured but Big Pharma is suppressing it",
    "Bill Gates is using vaccines to depopulate the world",
    "the deep state is running a secret pedophile network",
    "fluoride in water is a government mind control chemical",
    "the Rothschilds control every world government and central bank",
]
def make_sensationalist():
    claim = random.choice(SENS_CLAIMS)
    return (
        f"BREAKING!!! SHOCKING TRUTH EXPOSED: {claim.upper()}!!! "
        f"Anonymous whistleblowers with DEFINITIVE PROOF have come forward. "
        f"The mainstream media REFUSES to cover this bombshell!!! "
        f"Deep state operatives are PANICKING and trying to DELETE this content. "
        f"Big Pharma and globalist elites are TERRIFIED of this truth getting out!!! "
        f"Share before they CENSOR this!!! Wake up sheeple!!! "
        f"Do your own research — the evidence is OVERWHELMING and UNDENIABLE!!! "
        f"God bless the brave patriots fighting this EVIL agenda!!!"
    )

# ══════════════════════════════════════════════════════════════════════════════
# FAKE CATEGORY 2: Calm Medical Misinformation (YOUR BANANA EXAMPLE)
# ══════════════════════════════════════════════════════════════════════════════
CALM_FAKE_FOODS = [
    "bananas", "milk", "eggs", "rice", "tomatoes", "carrots", "watermelon",
    "oranges", "cucumbers", "onions", "garlic", "apples", "bread", "coffee",
]
CALM_FAKE_CONDITIONS = [
    "sudden heart failure", "kidney failure", "liver damage", "brain stroke",
    "respiratory collapse", "blood clotting", "toxic shock syndrome",
    "cardiac arrest", "organ failure", "nervous system damage",
]
CALM_FAKE_MECHANISMS = [
    "dangerous chemical reactions in the stomach",
    "toxic compounds released during nighttime digestion",
    "interference with heart rhythm during sleep",
    "dangerous acid buildup in the bloodstream",
    "blocking of essential enzymes in the liver",
    "reaction with digestive acids producing harmful gases",
    "disruption of the body's natural detox cycle",
    "interaction with melatonin causing dangerous side effects",
]
CALM_FAKE_SOURCES = [
    "international cardiologists", "leading nutritionists", "top doctors",
    "health experts", "medical researchers", "nutrition scientists",
    "a team of specialists", "renowned physicians",
]
CALM_FAKE_VAGUE = [
    "though no hospital or research institution has released an official statement",
    "however the source of this warning remains unverified",
    "the study cited has not been published in any medical journal",
    "experts have not been able to confirm the origin of this claim",
    "no peer-reviewed research supports this finding",
    "the alleged study cannot be found in any medical database",
    "though the institution behind this claim has not been identified",
]
CALM_FAKE_TIMES = [
    "after 8 PM", "late at night", "after 9 PM", "past midnight",
    "after sunset", "before sleeping", "in the evening hours",
]
def make_calm_medical():
    food    = random.choice(CALM_FAKE_FOODS)
    cond    = random.choice(CALM_FAKE_CONDITIONS)
    mech    = random.choice(CALM_FAKE_MECHANISMS)
    source  = random.choice(CALM_FAKE_SOURCES)
    vague   = random.choice(CALM_FAKE_VAGUE)
    time    = random.choice(CALM_FAKE_TIMES)
    title   = random.choice([
        f"Eating {food.capitalize()} {time} Causes {cond.title()}, Doctors Warn",
        f"Warning: Consuming {food.capitalize()} {time} Linked to {cond.title()}",
        f"Health Alert: {food.capitalize()} {time} Can Trigger {cond.title()}, Say Experts",
        f"Doctors Issue Warning About Eating {food.capitalize()} {time}",
        f"New Warning: {food.capitalize()} After Dark Causes {cond.title()}",
    ])
    body    = random.choice([
        f"A message circulating online claims that consuming {food} {time} can lead to {cond} due to {mech}. The warning allegedly comes from {source}, {vague}.",
        f"A viral post warns that eating {food} {time} triggers {cond} because of {mech}. The claim is attributed to {source}, {vague}.",
        f"Health warning spreading on social media states that {food} consumed {time} causes {cond} through {mech}. This is reportedly based on research by {source}, {vague}.",
        f"A widely shared health alert claims {source} have discovered that eating {food} {time} leads to {cond} due to {mech}. {vague.capitalize()}.",
    ])
    extra = random.choice([
        f" Many people have reportedly shared this warning with family members urging them to avoid {food} {time}.",
        f" The post has been shared millions of times on social media despite no official confirmation.",
        f" Health authorities have not issued any guidance on this topic.",
        f" No scientific literature supports the claim that {food} consumption at any time causes {cond}.",
    ])
    return f"{title}\n\n{body}{extra}"

# ══════════════════════════════════════════════════════════════════════════════
# FAKE CATEGORY 3: Pseudoscience / Health Hoax
# ══════════════════════════════════════════════════════════════════════════════
PSEUDO_SUBJECTS = [
    "lemon juice", "apple cider vinegar", "baking soda", "turmeric",
    "essential oils", "colloidal silver", "raw garlic", "coconut oil",
    "hydrogen peroxide", "alkaline water",
]
PSEUDO_CURES = [
    "cures cancer completely in 30 days",
    "eliminates diabetes permanently without medication",
    "reverses heart disease better than surgery",
    "kills all viruses including HIV and COVID",
    "regrows hair in bald patients within weeks",
    "repairs damaged kidneys without transplant",
    "cures autism in children naturally",
    "dissolves tumors without chemotherapy",
]
PSEUDO_SUPPRESSOR = [
    "Big Pharma has been hiding this cure for decades",
    "the medical establishment refuses to acknowledge this remedy",
    "doctors are paid to ignore this treatment",
    "the FDA has been suppressing this natural cure",
    "pharmaceutical companies buy out researchers who discover this",
]
def make_pseudoscience():
    subj = random.choice(PSEUDO_SUBJECTS)
    cure = random.choice(PSEUDO_CURES)
    supp = random.choice(PSEUDO_SUPPRESSOR)
    return (
        f"Natural remedy: {subj} {cure}. "
        f"A study allegedly conducted in a laboratory found that {subj} contains compounds that {cure.replace('cures','cure').replace('eliminates','eliminate')}. "
        f"However, {supp}. "
        f"The researchers who discovered this have reportedly faced pressure to retract their findings. "
        f"Thousands of patients claim to have been cured using this simple home remedy. "
        f"Doctors won't tell you this because it would put them out of business. "
        f"Try this remedy at home and share your results with others."
    )

# ══════════════════════════════════════════════════════════════════════════════
# FAKE CATEGORY 4: Political Misinformation
# ══════════════════════════════════════════════════════════════════════════════
POLITICAL_FAKE = [
    "Secret documents reveal the president signed an executive order to confiscate all privately owned firearms next month. The order was kept hidden from the public. Gun owners are urged to resist.",
    "Leaked emails show that election officials colluded with foreign governments to change vote counts in key districts. The mainstream media is covering this up.",
    "A government insider has confirmed that the unemployment numbers are fabricated. The real unemployment rate is three times higher than officially reported.",
    "Anonymous sources within the intelligence community confirm that the government has been spying on all private communications since 2010 without any legal authorization.",
    "Classified documents show that the government has been secretly poisoning the food supply to reduce fertility rates as part of a depopulation agenda.",
]
def make_political():
    return random.choice(POLITICAL_FAKE)

# ══════════════════════════════════════════════════════════════════════════════
# REAL CATEGORY 1: Medical Research
# ══════════════════════════════════════════════════════════════════════════════
REAL_INSTITUTIONS = [
    "Harvard Medical School","Johns Hopkins University","Stanford University",
    "Oxford University","the Mayo Clinic","the NIH","Yale School of Medicine",
    "Columbia University","UCLA","Imperial College London","MIT",
]
REAL_JOURNALS = [
    "the New England Journal of Medicine","Nature","The Lancet","JAMA",
    "PNAS","Science","the British Medical Journal","Nature Medicine",
    "Cell","Scientific Reports",
]
REAL_RESEARCHERS = [
    "Dr. Sarah Chen","Dr. James Okafor","Prof. Maria Rodriguez","Dr. David Kim",
    "Prof. Emily Thornton","Dr. Robert Patel","Prof. Jennifer Walsh",
    "Dr. Michael Torres","Dr. Amanda Singh","Prof. Christopher Lee",
]
REAL_MEDICAL_FINDINGS = [
    ("regular aerobic exercise", "reduces the risk of cardiovascular disease by approximately 30 percent", "22,000 participants over 15 years"),
    ("a Mediterranean diet", "was associated with a 25 percent reduction in all-cause mortality", "44,000 adults across seven European countries"),
    ("moderate coffee consumption of two to three cups daily", "was linked to a reduced risk of type 2 diabetes", "a cohort of 35,000 participants over 12 years"),
    ("childhood obesity intervention programs", "reduced BMI in participating children by an average of 1.4 points", "18,000 children across 120 schools"),
    ("the new immunotherapy drug", "reduced tumor size in 73 percent of patients with stage three lung cancer", "a randomized controlled trial of 2,100 patients"),
    ("sleep duration of less than six hours per night", "was associated with a 28 percent higher risk of developing type 2 diabetes", "a longitudinal study of 60,000 adults"),
    ("the mRNA vaccine candidate", "demonstrated 91 percent efficacy against severe disease in phase three trials", "43,000 participants across 28 countries"),
    ("annual mammography screening", "reduced breast cancer mortality by 19 percent in women aged 40 to 74", "a population study covering 1.2 million women"),
]
def make_real_medical():
    inst    = random.choice(REAL_INSTITUTIONS)
    journal = random.choice(REAL_JOURNALS)
    name    = random.choice(REAL_RESEARCHERS)
    subj, finding, sample = random.choice(REAL_MEDICAL_FINDINGS)
    template = random.choice([
        f"Researchers at {inst} published findings in {journal} showing that {subj} {finding}. The peer-reviewed study followed {sample}. Lead researcher {name} said the results were consistent with prior literature and controlled for age, BMI, and pre-existing conditions. The research had no pharmaceutical industry funding.",
        f"A new study in {journal} conducted by {inst} found that {subj} {finding}. The double-blind trial enrolled {sample}. {name} noted that while the findings are significant, replication in more diverse populations is recommended. The protocol was approved by an independent ethics board.",
        f"According to research published in {journal}, {subj} {finding}. The analysis by {inst} drew on data from {sample} and was independently verified by three external statisticians. {name} said the methodology was rigorous and the findings are clinically significant.",
    ])
    return template

# ══════════════════════════════════════════════════════════════════════════════
# REAL CATEGORY 2: Economics / Finance
# ══════════════════════════════════════════════════════════════════════════════
REAL_ECON_FINDINGS = [
    "the unemployment rate fell to 3.7 percent, below analyst forecasts of 3.9 percent, according to the Bureau of Labor Statistics",
    "GDP growth came in at 2.3 percent for the second quarter, slightly above the consensus estimate of 2.1 percent",
    "the Federal Reserve raised its benchmark interest rate by 25 basis points to a target range of 5.25 to 5.5 percent",
    "inflation as measured by the consumer price index fell to 3.2 percent annually, the lowest reading in 18 months",
    "the trade deficit narrowed by 8.4 billion dollars to its lowest level in three years following a surge in exports",
    "retail sales rose 0.4 percent in October, beating expectations of 0.2 percent growth according to Commerce Department data",
    "non-farm payrolls added 209,000 jobs last month while the labor force participation rate held steady at 62.8 percent",
]
REAL_ECON_ORGS = ["the Federal Reserve","the IMF","the World Bank","the Congressional Budget Office","the OECD","the Bureau of Labor Statistics"]
def make_real_economics():
    finding = random.choice(REAL_ECON_FINDINGS)
    org     = random.choice(REAL_ECON_ORGS)
    name    = random.choice(REAL_RESEARCHERS)
    return random.choice([
        f"{org} reported on Wednesday that {finding}. Economists at Goldman Sachs and JPMorgan said the data aligned with their forecasts. {name} at {random.choice(REAL_INSTITUTIONS)} said the figures suggest the economy remains resilient despite elevated interest rates.",
        f"New data released by {org} showed that {finding}. The report, which is subject to revision, was broadly in line with market expectations. Officials cautioned that significant uncertainty remains in the near-term outlook.",
        f"According to the latest report from {org}, {finding}. The data was collected using standard national accounts methodology and reviewed by independent auditors. Analysts said the numbers support the case for a pause in rate increases at the next policy meeting.",
    ])

# ══════════════════════════════════════════════════════════════════════════════
# REAL CATEGORY 3: Environment / Science
# ══════════════════════════════════════════════════════════════════════════════
REAL_ENV_FINDINGS = [
    "global mean temperatures in 2023 were 1.45 degrees Celsius above pre-industrial levels, according to the World Meteorological Organization",
    "renewable energy capacity additions reached a record 295 gigawatts globally last year, with solar accounting for two-thirds of new installations",
    "sea levels along the US Atlantic coast rose an average of 4.2 millimeters per year over the past decade, double the global average",
    "atmospheric carbon dioxide concentrations reached 421 parts per million in May, the highest level in 3 million years",
    "the ozone layer is projected to fully recover to 1980 levels by 2066, according to a UN scientific assessment",
    "arctic sea ice extent reached its sixth lowest minimum on record this September according to NASA satellite data",
]
def make_real_environment():
    finding = random.choice(REAL_ENV_FINDINGS)
    inst    = random.choice(REAL_INSTITUTIONS)
    journal = random.choice(REAL_JOURNALS)
    name    = random.choice(REAL_RESEARCHERS)
    return random.choice([
        f"Scientists confirmed that {finding}. The data was compiled from {random.randint(50,200)} monitoring stations across six continents and cross-referenced with satellite measurements. {name} at {inst} said the findings were consistent with climate model projections published in {journal}.",
        f"A new report published in {journal} found that {finding}. The analysis drew on four decades of observational data reviewed by an independent panel of 12 scientists. {name} said the methodology was robust and the conclusions well-supported.",
        f"Researchers at {inst} reported that {finding}. The study, published in {journal}, used peer-reviewed methodology and was funded by the National Science Foundation with no industry involvement. Independent experts called the findings credible and consistent with existing evidence.",
    ])

# ══════════════════════════════════════════════════════════════════════════════
# REAL CATEGORY 4: Policy / Legal
# ══════════════════════════════════════════════════════════════════════════════
REAL_POLICY = [
    "The Senate passed the bipartisan infrastructure bill by a vote of 68 to 31 following six weeks of negotiations. The legislation allocates funds for roads, bridges, broadband expansion, and clean energy projects. Both parties said the bill represented a necessary investment in the country's aging infrastructure.",
    "The Supreme Court ruled 6 to 3 that the Environmental Protection Agency has authority to regulate greenhouse gas emissions from power plants under the Clean Air Act. The majority opinion, written by Chief Justice Roberts, affirmed the agency's broad regulatory mandate.",
    "The Federal Trade Commission filed an antitrust lawsuit against a major technology company alleging it illegally maintained a monopoly in the online advertising market. The complaint cites internal documents showing executives were aware the practices harmed competition.",
    "The city council voted 9 to 2 to approve a new zoning ordinance allowing higher-density residential development near public transit corridors. Housing advocates said the measure would help address the shortage of affordable units.",
    "Parliament approved new financial disclosure requirements for elected officials by a margin of 342 to 178. The legislation requires annual reporting of assets, liabilities, and outside income within 30 days of the end of each fiscal year.",
]
def make_real_policy():
    return random.choice(REAL_POLICY)

# ══════════════════════════════════════════════════════════════════════════════
# ASSEMBLE DATASET
# ══════════════════════════════════════════════════════════════════════════════
def generate(n_per_type=800):
    rows = []
    fake_makers = [make_sensationalist, make_calm_medical, make_pseudoscience, make_political]
    real_makers = [make_real_medical, make_real_economics, make_real_environment, make_real_policy]

    for maker in fake_makers:
        for _ in range(n_per_type):
            rows.append({"text": maker(), "label": "FAKE"})

    for maker in real_makers:
        for _ in range(n_per_type):
            rows.append({"text": maker(), "label": "REAL"})

    random.shuffle(rows)
    return rows

if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "dataset", "fake_news.csv")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    rows = generate(800)
    with open(out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text","label"])
        writer.writeheader()
        writer.writerows(rows)
    fake_c = sum(1 for r in rows if r["label"]=="FAKE")
    real_c = sum(1 for r in rows if r["label"]=="REAL")
    print(f"Generated {len(rows)} articles | FAKE: {fake_c} | REAL: {real_c}")
    print("Now run: python train_model.py")