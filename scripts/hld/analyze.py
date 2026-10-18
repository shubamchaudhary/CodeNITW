"""Count how often each HelloInterview problem is reported as an HLD question in LeetCode Discuss posts.

Step 2 of the HLD page's ranking: reads what collect.py saved, prints the
table, and with --write rewrites the RANKING block of src/Data/HLDPrep.js.
--samples <slug> prints the lines that matched one problem, to check the
patterns by eye.

usage: python -I scripts/hld/analyze.py <data_dir> [--write src/Data/HLDPrep.js] [--samples slug]
"""
import json, re, sys, os, collections, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

DATA = sys.argv[1]
def _opt(name):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None
SAMPLE = _opt("--samples")
WRITE = _opt("--write")  # src/Data/HLDPrep.js: replaces the block between the RANKING markers
SINCE = _opt("--since") or "0000"  # only reports posted in this year or later

# The score (mostly the share of SDE2-level reports naming a problem) that
# puts it in each tier. Cut on the score, so a tier is a run of ranks.
TIERS = [("P0", 0.06), ("P1", 0.035), ("P2", 0.0175), ("P3", 0.0)]

# How many of the 11 published "most asked" lists PracHub merged (June 2026)
# include each problem; None: not in their top 30.
# https://prachub.com/resources/top-30-system-design-questions-ranked-by-how-often-they-re-asked
LISTS = {"bitly": 11, "whatsapp": 10, "fb-news-feed": 10, "youtube": 10, "uber": 9, "distributed-rate-limiter": 9,
         "dropbox": 8, "web-crawler": 8, "notification-system": 7, "yelp": 7, "instagram": 6, "ticketmaster": 6,
         "distributed-cache": 6, "payment-system": 6, "google-docs": 6, "ad-click-aggregator": 5, "metrics-monitoring": 5,
         "job-scheduler": 5, "gopuff": 4, "robinhood": 4, "chatgpt": 3, "top-k": 3, "tinder": 2}

W = r"[\s\-_]*"  # flexible separator

# Plain aliases: count when they appear on a question line.
# Named aliases (company / product names that are also employers): count only in
# "design X" / "like X" / "X clone" phrasing.
P = {
    "bitly": dict(
        plain=[rf"url{W}shorten", rf"shorten(ed|ing)?{W}(url|link)s?", rf"short{W}(url|link){W}(service|system|generator)", rf"tiny{W}url", r"bit\.?ly", rf"link{W}shorten", r"pastebin"],
        named=[]),
    "dropbox": dict(
        plain=[rf"google{W}drive", rf"one{W}drive", rf"file{W}(storage|sharing|sync(ing|hroni[sz]ation)?|upload(ing|er)?|hosting|backup){W}(service|system|app|application|platform)", rf"cloud{W}(file{W})?storage{W}(service|system|app|platform)", rf"(document|file){W}storage{W}(and|&){W}sharing"],
        named=["dropbox", rf"i{W}cloud", rf"box\.com"]),
    "yelp": dict(
        plain=[rf"proximity{W}(service|server|search|system)", rf"nearby{W}(places|restaurants|businesses|stores|shops|search|hospitals|points)", rf"(find|search|show|discover){W}(nearby|near{W}by)", rf"location{W}based{W}(search|service|recommendation)s?", rf"points?{W}of{W}interest", rf"restaurant{W}(search|discovery|finder|review)", rf"(business|place){W}review"],
        named=["yelp", rf"google{W}maps?", rf"tripadvisor", rf"just{W}dial", rf"four{W}square"]),
    "gopuff": dict(
        plain=[rf"grocery{W}(delivery|app|ordering|platform)", rf"quick{W}commerce", rf"q{W}commerce", rf"local{W}delivery", rf"(10|ten|15){W}min(ute)?s?{W}delivery", rf"food{W}(delivery|ordering)", rf"hyper{W}local{W}delivery", rf"delivery{W}(partner{W})?(assignment|dispatch)"],
        named=["gopuff", rf"go{W}puff", "instacart", "blinkit", "zepto", "instamart", rf"big{W}basket", "dunzo", "swiggy", "zomato", rf"door{W}dash", rf"uber{W}eats", "deliveroo", "grubhub"]),
    "ticketmaster": dict(
        plain=[rf"(movie|event|concert|show|flight|bus|train|cinema|theat(er|re)|match){W}(ticket(ing)?|seat){W}(booking|reservation|system|app|platform)", rf"ticket(ing)?{W}(booking|reservation|selling)", rf"seat{W}(booking|reservation|selection|locking|allocation)", rf"(book|reserve){W}(a{W})?(movie|event|concert)?{W}tickets?", rf"(movie|event|concert){W}booking", rf"book{W}my{W}show", r"\bbms\b"],
        named=[rf"ticket{W}master", "irctc", rf"red{W}bus", "eventbrite", rf"district{W}app", "paytm insider"]),
    "instagram": dict(
        plain=[rf"photo{W}sharing", rf"(image|photo|picture){W}(sharing|upload|feed){W}(app|platform|service|system)?"],
        named=["instagram", "flickr", "pinterest", "snapchat"]),
    "fb-news-feed": dict(
        plain=[rf"news{W}feed", rf"(facebook|fb|linkedin|social){W}feed", rf"(home|user){W}timeline", rf"social{W}(media|network(ing)?){W}(feed|app|platform|site)", rf"feed{W}(system|service|generation|ranking)", r"tweets?\b(?!\s*search)"],
        named=["twitter", rf"x\.com", "facebook", "threads", "reddit", "quora"]),
    "tinder": dict(
        plain=[rf"dating{W}(app|site|platform|service|application)", rf"swipe{W}(left|right|based)"],
        named=["tinder", "bumble", "hinge"]),
    "leetcode": dict(
        plain=[rf"online{W}judge", rf"coding{W}(contest|competition|judge|assessment){W}(platform|system|site)", rf"competitive{W}programming{W}(platform|site)", rf"code{W}(execution|submission|runner|judge|evaluation){W}(service|engine|platform|system)", rf"leetcode{W}(like|clone){W}(platform|system|judge|app|site)",
               # "Design LeetCode", "platform like HackerRank" — never "similar to leetcode.com/problems/..."
               rf"design(?:ing|ed)?\W+(?:an?\W+)?(?:(?!(?:round|interview|on|in|and|expert|using|with)\b)[\w-]+\W+){{0,2}}?(?<!#)(leetcode|hacker{W}rank|codeforces|codechef)\b(?!\.com|{W}style|{W}problem|{W}question)",
               rf"(platform|judge|site|system|app)\W+(like|similar{W}to)\W+(leetcode|hacker{W}rank|codeforces|codechef)\b(?!\.com)"],
        named=[]),
    "whatsapp": dict(
        plain=[rf"chat{W}(app|application|system|service|server|platform|messenger|functionality|feature)", rf"messaging{W}(app|application|service|platform)", rf"real{W}time{W}(chat|messaging)", rf"group{W}chat", rf"(1|one){W}(to|on|-|:){W}(1|one){W}(chat|messaging)", rf"instant{W}messag", r"\bmessenger\b"],
        named=[rf"whats{W}app", "slack", "telegram", rf"microsoft{W}teams", "discord", "signal"]),
    "strava": dict(
        plain=[rf"fitness{W}(tracker|tracking|app)", rf"run(ning)?{W}(tracker|tracking){W}app", rf"workout{W}(tracker|tracking)", rf"activity{W}track(er|ing){W}(app|system|service)", rf"(step|run|ride){W}track(er|ing)"],
        named=["strava", "fitbit", "nike run club"]),
    "distributed-cache": dict(
        plain=[rf"distributed{W}(in{W}memory{W})?cach(e|ing)", rf"(design|build|implement|architect)\w*{W}(an?{W})?(scalable{W}|distributed{W}|in{W}memory{W}|global{W})*(cache|caching){W}(system|service|layer)\b", rf"(design|build|implement)\w*{W}(an?{W})?(distributed{W})?cache\b(?!{W}(eviction|policy|for))", rf"caching{W}(system|service)", rf"distributed{W}key{W}value{W}(store|cache)", rf"design{W}(an?{W})?(redis|memcached)\b", rf"(redis|memcached){W}(like|clone)", rf"like{W}(redis|memcached)\b"],
        named=[]),
    "distributed-rate-limiter": dict(
        plain=[rf"rate{W}limit(er|ing)?", rf"api{W}throttl", rf"throttl(ing|er){W}(service|system)"],
        named=[]),
    "online-auction": dict(
        plain=[r"auction", rf"bidding{W}(system|platform|app|service|site)", rf"real{W}time{W}bid"],
        named=["ebay"]),
    "youtube": dict(
        plain=[rf"video{W}(streaming|sharing|upload|platform|on{W}demand|hosting){W}(service|system|platform|app|site)?", rf"ott{W}platform", rf"live{W}(video{W})?streaming", rf"music{W}streaming", rf"(video|movie){W}streaming"],
        named=[rf"you{W}tube(?!{W}top)", "netflix", "hotstar", rf"prime{W}video", rf"tik{W}tok", "twitch", "spotify", rf"jio{W}cinema", "reels"]),
    "job-scheduler": dict(
        plain=[rf"(job|task){W}(scheduler|scheduling)", rf"distributed{W}(cron|scheduler|scheduling)", rf"cron{W}(job{W})?(service|system|scheduler)", rf"delayed{W}(job|task)s?", rf"workflow{W}(engine|orchestrat)", rf"schedul(er|ing){W}(service|system)"],
        named=["airflow"]),
    "fb-live-comments": dict(
        plain=[rf"live{W}comment", rf"comments?{W}(on|for|in){W}(a{W})?live", rf"real{W}time{W}comment", rf"live{W}(reactions|chat{W}(for|on|in){W}(a{W})?(live{W})?(stream|video|match))", rf"live{W}(cricket{W})?(score|commentary)", "cricbuzz"],
        named=[]),
    "google-news": dict(
        plain=[rf"news{W}aggregat", rf"google{W}news", rf"rss{W}(reader|feed|aggregat)", rf"news{W}(app|website|portal|platform)"],
        named=["inshorts"]),
    "camelcamelcamel": dict(
        plain=[rf"price{W}(change{W})?(track|alert|drop|watch|monitor|comparison|notif)", rf"camel{W}camel"],
        named=["keepa"]),
    "notification-system": dict(
        plain=[rf"notification{W}(system|service|platform|engine|server|framework|pipeline|infra)", rf"push{W}notification", rf"(design|build)\w*{W}(an?{W})?(scalable{W}|distributed{W})?notification", rf"alert(ing)?{W}(system|service)", rf"(email|sms){W}(delivery{W})?(service|system|gateway)"],
        named=[]),
    "top-k": dict(
        plain=[rf"top{W}k\b(?!{W}(frequent{W}(elements|words)|closest|largest|smallest))", rf"top{W}\d+{W}(most{W})?(trending|popular|viewed|played|searched|selling|frequent{W}(videos|songs|products|items|hashtags))", rf"trending{W}(hashtags?|topics|videos|products|searches|posts)", rf"heavy{W}hitters?", rf"leader{W}board", rf"most{W}(viewed|played|popular|searched){W}(videos|songs|items|products|searches)"],
        named=[]),
    "uber": dict(
        plain=[rf"ride{W}(sharing|hailing|booking)", rf"cab{W}(booking|aggregator|service|app|hailing)", rf"taxi{W}(booking|service|app|hailing)", rf"driver{W}(matching|location{W}track|dispatch)", rf"(match|matching){W}(riders?|drivers?)"],
        named=[r"\buber\b(?!{W}eats)", r"\bola\b", "lyft", "rapido", rf"name{W}it"]),
    "robinhood": dict(
        plain=[rf"stock{W}(broker|brokerage|trading|exchange|market{W}(app|platform|system))", rf"trading{W}(platform|app|system|engine)", rf"(order{W})?matching{W}engine", rf"crypto{W}(exchange|trading)", rf"share{W}market{W}app", rf"order{W}book"],
        named=["robinhood", "zerodha", "groww", "upstox", "coinbase", "binance"]),
    "google-docs": dict(
        plain=[rf"google{W}docs?", rf"collaborative{W}(text{W}|code{W}|document{W})?(editor|editing|document|whiteboard|docs?)", rf"real{W}time{W}(collaborat|document{W}edit|co{W}edit)", rf"co{W}editing", rf"online{W}(doc|document|code){W}editor", rf"operational{W}transform", r"\bcrdt"],
        named=["notion", "confluence", "figma", "etherpad", rf"google{W}sheets"]),
    "web-crawler": dict(
        plain=[rf"web{W}crawl", r"crawler", rf"crawl(ing)?{W}(system|service|the{W}web|websites|pages|urls)", rf"web{W}scrap", r"spider"],
        named=[]),
    "ad-click-aggregator": dict(
        plain=[rf"ad{W}click", rf"click{W}(aggregat|stream|count|track|analytic)", rf"ads?{W}(aggregat|analytics|impression|event|metrics)", rf"impression{W}(count|track)", rf"real{W}time{W}(analytics|aggregation|event{W}count)", rf"event{W}(aggregat|counting)"],
        named=[]),
    "fb-post-search": dict(
        plain=[rf"post{W}search", rf"(tweet|twitter|facebook|fb){W}search", rf"search{W}(engine|system|service|backend)", rf"full{W}text{W}search", rf"inverted{W}index", rf"search{W}(posts|tweets|over|across){W}"],
        named=[rf"elastic{W}search{W}(like|clone)"]),
    "payment-system": dict(
        plain=[rf"payment{W}(system|gateway|service|platform|processing|app|flow|infra)", rf"wallet{W}(system|service|app)", rf"digital{W}wallet", rf"money{W}transfer", rf"(e{W}commerce|order){W}(payment|checkout)", rf"checkout{W}(system|service|flow)", rf"upi{W}(system|app|payment)", rf"(design|build)\w*{W}(an?{W})?(scalable{W}|distributed{W})?payment"],
        named=["stripe", "razorpay", "paypal", "paytm", "phonepe", rf"google{W}pay", rf"amazon{W}pay"]),
    "metrics-monitoring": dict(
        plain=[rf"metrics?{W}(monitoring|collection|system|service|aggregat|pipeline|dashboard|platform)", rf"monitoring{W}(system|service|platform|tool|dashboard)", rf"(logging|log){W}(system|service|aggregat|collection|pipeline|analy|platform|monitoring)", rf"centralized{W}logging", r"observability", rf"distributed{W}tracing", rf"(health{W}check|uptime){W}(system|service|monitor)", rf"apm{W}(system|tool)"],
        named=["datadog", "prometheus", "grafana", "splunk", "new relic"]),
    "online-chess": dict(
        plain=[rf"online{W}(chess|game|gaming|multiplayer)", rf"multiplayer{W}(game|gaming)", rf"game{W}(server|matchmaking|lobby|backend)", rf"(real{W}time{W})?chess{W}(platform|app|game|server)"],
        named=["chess.com", "lichess", "ludo", "poker", "rummy", rf"dream{W}11", rf"fantasy{W}(sports|cricket)"]),
    "chatgpt": dict(
        plain=[rf"(llm|gen{W}ai|genai|ai){W}(chat(bot)?|serving|inference|assistant|platform)", rf"chat{W}bot", rf"inference{W}(service|system|platform)", rf"rag{W}(system|pipeline|service)", rf"conversational{W}ai"],
        named=[rf"chat{W}gpt", "openai", "gemini", rf"claude(?!{W}code)", "copilot"]),
    "flash-sale": dict(
        plain=[rf"flash{W}sale", rf"(limited|high){W}(inventory|stock){W}sale", rf"big{W}billion{W}days?", rf"(prime|lightning|mega){W}(day|deal|sale)s?", rf"inventory{W}(reservation|management){W}(system|service)", rf"(e{W}commerce|amazon|flipkart){W}(sale|deal)s?{W}(system|event)?", rf"(coupon|deal){W}(system|service|platform)", rf"(high{W}traffic|black{W}friday){W}sale"],
        named=[]),
}

# Classics HelloInterview has no breakdown for: counted only to report gaps.
GAPS = {
    "typeahead / autocomplete": [rf"type{W}ahead", rf"auto{W}(complete|suggest)", rf"search{W}(suggest|autocomplete|recommendation)"],
    "key-value store": [rf"key{W}value{W}(store|database|db|storage)", r"dynamo\s?db(?!\s+for)", rf"distributed{W}(kv|key{W}value)"],
    "message queue (Kafka)": [rf"(message|messaging){W}(queue|broker)", rf"pub{W}sub{W}(system|service)", rf"kafka{W}(like|clone)", rf"(design|build)\w*{W}(an?{W})?(distributed{W})?(queue|kafka)\b"],
    "hotel / Airbnb booking": [rf"hotel{W}(booking|reservation|management)", r"airbnb", rf"(room|stay|property){W}(booking|reservation|rental)", r"oyo", rf"make{W}my{W}trip"],
    "unique ID generator": [rf"(unique|distributed){W}id{W}(generat|service)", r"snowflake", rf"id{W}generator"],
    "Google Maps / navigation": [rf"google{W}maps?", rf"(route|eta|navigation){W}(service|system|planning|calculation)"],
    "e-commerce / Amazon order system": [rf"e{W}commerce{W}(platform|site|system|app|website)", rf"(order|cart){W}(management|placement|service|system)", rf"(design|build)\w*{W}(an?{W})?(amazon|flipkart|myntra|meesho)\b", rf"place{W}order"],
    "parking lot (HLD)": [rf"parking{W}(lot|garage)"],
    "Splitwise (HLD)": [rf"split{W}wise", rf"expense{W}shar"],
    "inventory management": [rf"inventory{W}(management|system|service|tracking)", rf"warehouse{W}(management|system)"],
    "search engine (Google)": [rf"google{W}search", rf"design{W}(a{W})?search{W}engine"],
    "API gateway / load balancer": [rf"api{W}gateway", rf"load{W}balancer"],
}

COMPILED = {}
for slug, d in P.items():
    plain = re.compile("|".join(f"(?:{p})" for p in d["plain"]), re.I) if d["plain"] else None
    if d["named"]:
        alias = "|".join(f"(?:{n})" for n in d["named"])
        # "design (a ...) uber", "like uber", "uber clone", "similar to uber"
        named = re.compile(
            rf"(?:\bdesign\w*|\blike|\bsimilar\s+to|\bclone\s+of|\bsystem\s+for|\bbackend\s+(?:of|for)|\bhld\s+(?:of|for))"
            rf"(?:\W+(?!(?:round|interview|loop|at|in|for|with|experience|process|team|and|by|from|the\s+interviewer|@|using|via|through|on|watching|watched|channel|videos?|tutorials?|youtube)\b)[\w.'-]+){{0,5}}?\W+\b(?:{alias})\b"
            rf"|\b(?:{alias})\W*(?:clone|like\s+(?:app|platform|system|service))\b",
            re.I)
    else:
        named = None
    COMPILED[slug] = (plain, named)
GAP_RX = {k: re.compile("|".join(f"(?:{p})" for p in v), re.I) for k, v in GAPS.items()}

LLD_RX = re.compile(rf"\blld\b|low{W}level{W}design|machine{W}coding|object{W}oriented|\booad?\b|class{W}diagram|\bood\b|\bsolid\b|design{W}patterns?", re.I)
HLD_RX = re.compile(rf"\bhld\b|high{W}level{W}design|system{W}design|\bsd\b{W}round|architecture{W}round|design{W}round", re.I)
DSA_RX = re.compile(rf"\bdsa\b|data{W}structures?|problem{W}solving|coding{W}round|leetcode{W}(medium|hard|easy)|\bonline{W}assessment|\boa\b|behaviou?ral|hiring{W}manager|bar{W}raiser|\bhr\b{W}round|\bmanagerial", re.I)
CUE_RX = re.compile(rf"design|\bhld\b|high{W}level|\basked\b|question|problem|\bbuild|\bround\b|architect|\bsystem\b|scal|\bq\d|\bprompt\b", re.I)

MID_RX = re.compile(
    rf"\bsde{W}?(2|ii)\b|\bswe{W}?(2|ii)\b|software{W}(development{W})?engineer{W}(2|ii)\b|\bse{W}(2|ii)\b|\bmts{W}?(2|ii)\b|member{W}of{W}technical{W}staff{W}(2|ii)"
    rf"|\bl4\b|\be4\b|\bic2\b|\bl6[12]\b|\bsse\b|senior{W}software{W}engineer|\bsenior{W}(sde|swe|developer|engineer)\b|\bsde{W}?1\.5|\bmid{W}level|\bmid{W}senior|\bp2\b|\bsmts\b|\bswe{W}?iii?\b", re.I)
SENIOR_RX = re.compile(rf"\bsde{W}?(3|iii)\b|\bstaff\b|\bprincipal\b|\bl6\b|\be5\b|\be6\b|\bl7\b|engineering{W}manager|\bem\b{W}(role|interview|position)|\blead{W}(engineer|developer)|\barchitect\b|\bic5\b|\bic6\b|\bsde{W}?1\b|\bnew{W}grad|\bintern(ship)?\b|\bfresher\b|\bcampus\b", re.I)
QFORM_RX = re.compile(rf"design|\bhld\b|high{W}level|\bbuild|implement|architect|\basked\b|question|problem|\btopic|\bround\b|\bq\d|prompt|scenario|\btask\b|\bcreate|\bsd\b|system{W}for|[:\-–—>]\s*\**\s*$", re.I)
PREP_RX = re.compile(rf"practi[cs]|prepar|\bprep\b|studied|revis|went{W}through|watched|resources?\b|course|grokking|alex{W}xu|hello{W}?interview|neetcode|bytebytego|i{W}(can|could){W}solve|familiar|you{W}should|make{W}sure|must{W}know|common{W}(questions|problems)|for{W}example|e\.g\.", re.I)
ASKED_RX = re.compile(rf"\basked\b|interviewer|\bround\b|\bq\d|question\s*[:\-]", re.I)
NOT_REPORT_TITLE = re.compile(rf"\b(how{W}to|how{W}i{W}(approach|prepare|prepared|study|learn)|guide|roadmap|tips|cheat{W}?sheet|concepts|building{W}blocks|patterns|framework|need{W}(guidance|help|advice)|beginner|study{W}plan|prep(aration)?{W}(journey|plan|strategy|guide|resources)|explained|template|checklist|must{W}know|resources?|best{W}free|what{W}to{W}(study|prepare)|which{W}(book|course)|opinion|prep|practice|platform{W}for|career|market|layoffs?|shut{W}down|salary|compensation)\b", re.I)
REPORT_RX = re.compile(rf"interview|\bround\b|onsite|\bloop\b|offer|rejected|selected|\basked\b|screening|hiring|\boa\b", re.I)
# A report's title names the company/role/outcome: "Flipkart || SDE 2 || Rejected".
TITLE_REPORT_RX = re.compile(rf"interview|experience|\bexp\b|round|onsite|loop|offer|reject|select|ghosted|\boa\b|\bhld\b|system{W}design|\bsde|\bswe|\bsse\b|smts|\bmts|\bl\d+\b|\be\d\b|\bic\d\b|asked|questions?|engineer|developer|backend|\|", re.I)

def is_report(title, content):
    if NOT_REPORT_TITLE.search(title or "") or not TITLE_REPORT_RX.search(title or ""):
        return False
    return bool(REPORT_RX.search((title or "") + " " + (content or "")[:1500]))

YOE_RX = re.compile(rf"(\d{{1,2}}(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?|yoe)\b|\byoe\W{{0,3}}(\d{{1,2}}(?:\.\d+)?)", re.I)

def level_of(title, content):
    head = (title or "") + "\n" + (content or "")[:900]
    yoe = None
    for m in YOE_RX.finditer(head):
        v = m.group(1) or m.group(2)
        try:
            v = float(v)
        except Exception:
            continue
        if 0 < v < 30:
            yoe = v
            break
    # A stated SDE2-band title wins over years of experience.
    if MID_RX.search(head):
        return "mid"
    if yoe is not None:
        return "mid" if 2 <= yoe <= 5 else ("junior" if yoe < 2 else "senior")
    if SENIOR_RX.search(head):
        return "other"
    return "unknown"

def stated(line, start, in_hld):
    """Is the name at `start` stated as the question, not a component in someone's
    answer ("API gateway: auth, authorization, and rate limiting")?"""
    head = line[:start]
    # A short line inside an HLD section that leads with the name: "- BookMyShow",
    # "Round 3 (HLD - Job Scheduler)".
    if in_hld and len(line) <= 70 and start <= 30 and "," not in head:
        return True
    # Or a question word just before it, with no list running in between.
    window = head[-50:]
    cues = list(QFORM_RX.finditer(window))
    return bool(cues) and not re.search(r"[,;]|\band\b|\bthen\b", window[cues[-1].end():])

def problems_in(title, content):
    found = {}
    gaps = set()
    # Older posts store line breaks as a literal "\n".
    text = (title or "") + "\n" + (content or "").replace("\\n", "\n").replace("\\t", " ")
    ctx = None
    for raw in re.split(r"[\r\n]+|(?<=[.!?])\s+(?=[A-Z0-9])", text):
        line = raw.strip()
        if not line:
            continue
        is_lld, is_hld, is_dsa = bool(LLD_RX.search(line)), bool(HLD_RX.search(line)), bool(DSA_RX.search(line))
        if is_hld and not is_lld:
            ctx = "hld"
        elif is_lld and not is_hld:
            ctx = "lld"
        elif is_dsa and not is_hld:
            ctx = "dsa"
        if ctx in ("lld", "dsa") and not is_hld:
            continue
        if is_lld and not is_hld:
            continue
        cue = ctx == "hld" or CUE_RX.search(line)
        if not cue:
            continue
        # "I practised URL shortener, rate limiter..." is preparation, not a question asked.
        if PREP_RX.search(line) and not ASKED_RX.search(line):
            continue
        for slug, (plain, named) in COMPILED.items():
            if slug in found:
                continue
            if named and named.search(line):
                found[slug] = line[:220]
                continue
            m = plain.search(line) if plain else None
            if m and stated(line, m.start(), ctx == "hld"):
                found[slug] = line[:220]
        for g, rx in GAP_RX.items():
            m = rx.search(line)
            if m and stated(line, m.start(), ctx == "hld"):
                gaps.add(g)
    # "YouTube top K" is Top K, not YouTube
    if "top-k" in found and "youtube" in found and re.search(r"top\W*k", found["youtube"], re.I):
        del found["youtube"]
    # "Trending tweets", "Twitter search", "Facebook Messenger" name a site but
    # ask for a different system — a feed question says feed or timeline.
    feed = found.get("fb-news-feed")
    if feed and re.search(r"trend|top\W*k|notification|search|messeng|messag|chat|count", feed, re.I) \
            and not re.search(r"feed|timeline", feed, re.I):
        del found["fb-news-feed"]
    return found, gaps

def main():
    rows = []
    with open(os.path.join(DATA, "content.jsonl"), encoding="utf-8") as f:
        for line in f:
            try:
                rows.append(json.loads(line))
            except Exception:
                pass
    seen_titles = set()
    tot = collections.Counter(); mid = collections.Counter(); recent_mid = collections.Counter()
    gap_tot = collections.Counter(); gap_mid = collections.Counter()
    n_posts = n_hld = n_mid = n_recent_mid = 0
    levels = collections.Counter(); years = collections.Counter()
    samples = []
    dates = []
    for r in rows:
        content = r.get("content") or ""
        # Reposts and cross-posts: same text, different id.
        key = re.sub(r"\W+", "", content.lower())[:400]
        if not key or key in seen_titles:
            continue
        seen_titles.add(key)
        if not is_report(r.get("title"), content) or (r.get("createdAt") or "")[:4] < SINCE:
            continue
        n_posts += 1
        found, gaps = problems_in(r.get("title"), content)
        if not found and not gaps:
            continue
        n_hld += 1
        lvl = level_of(r.get("title"), content)
        levels[lvl] += 1
        yr = (r.get("createdAt") or "")[:4]
        years[yr] += 1
        dates.append((r.get("createdAt") or "")[:7])
        for s in found:
            tot[s] += 1
            if lvl == "mid":
                mid[s] += 1
                if yr >= "2025":
                    recent_mid[s] += 1
        for g in gaps:
            gap_tot[g] += 1
            if lvl == "mid":
                gap_mid[g] += 1
        if lvl == "mid":
            n_mid += 1
            if yr >= "2025":
                n_recent_mid += 1
        if SAMPLE and SAMPLE in found:
            samples.append((r.get("title"), found[SAMPLE]))
    if SAMPLE:
        for t, l in samples[:40]:
            print("-", (t or "")[:70], "||", l)
        print(len(samples), "posts")
        return
    print(f"posts={n_posts} with_hld_question={n_hld} mid_level={n_mid} mid_2025+={n_recent_mid}")
    print("levels", dict(levels)); print("years", dict(sorted(years.items())))
    out = []
    for s in P:
        a, m, rm = tot[s], mid[s], recent_mid[s]
        out.append(dict(slug=s, all=a, mid=m, mid_recent=rm,
                        all_share=a / max(n_hld, 1), mid_share=m / max(n_mid, 1)))
    for o in out:
        o["score"] = 0.75 * o["mid_share"] + 0.25 * o["all_share"]
    out.sort(key=lambda o: -o["score"])
    print(f"{'#':>2} {'slug':26} {'all':>5} {'mid':>5} {'mid25+':>6} {'mid%':>6} {'all%':>6}")
    for i, o in enumerate(out, 1):
        print(f"{i:>2} {o['slug']:26} {o['all']:>5} {o['mid']:>5} {o['mid_recent']:>6} {100*o['mid_share']:>5.1f}% {100*o['all_share']:>5.1f}%")
    print("\nGaps (not on HelloInterview):")
    for g, c in gap_tot.most_common():
        print(f"   {g:34} all={c:>5} mid={gap_mid[g]:>5} mid%={100*gap_mid[g]/max(n_mid,1):.1f}")
    dates = sorted(d for d in dates if d)
    if WRITE:
        write_ranking(WRITE, out, n_hld, n_mid, dates[0], dates[-1])
    json.dump(dict(n_posts=n_posts, n_hld=n_hld, n_mid=n_mid, n_recent_mid=n_recent_mid, ranking=out,
                   gaps={g: dict(all=gap_tot[g], mid=gap_mid[g]) for g in GAPS}),
              open(os.path.join(DATA, "ranking.json"), "w"), indent=1)

MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()

def month(ym):
    y, m = ym.split("-")
    return f"{MONTHS[int(m) - 1]} {y}"

def write_ranking(path, out, n_hld, n_mid, first, last):
    lines = ["// RANKING_START",
             "// Written by scripts/hld/analyze.py — rerun it rather than editing by hand.",
             "// [id, priority, seen in interview reports { mid: SDE2-level, mid2025: of those since 2025, all: any level }, lists]",
             "// lists: how many of 11 published \"most asked\" lists include it (null: not in their top 30).",
             "const RANKING = ["]
    for o in out:
        tier = next(t for t, cut in TIERS if o["score"] >= cut)
        lists = LISTS.get(o["slug"])
        lines.append(f'  ["{o["slug"]}", "{tier}", {{ mid: {o["mid"]}, mid2025: {o["mid_recent"]}, all: {o["all"]} }}, {"null" if lists is None else lists}],')
    lines += ["];", "",
              "export const HLD_EVIDENCE = {",
              f"  posts: {n_hld},",
              f"  midPosts: {n_mid},",
              f'  summary: "Ranked by how often each problem is named as the system design question in {n_mid} SDE2-level (SDE2 / 2–5 YOE) interview reports on LeetCode Discuss, {month(first)} – {month(last)}, out of {n_hld} reports at all levels.",',
              "};",
              "// RANKING_END"]
    src = open(path, encoding="utf-8").read()
    a, b = src.index("// RANKING_START"), src.index("// RANKING_END") + len("// RANKING_END")
    open(path, "w", encoding="utf-8", newline="\n").write(src[:a] + "\n".join(lines) + src[b:])
    print("wrote", path)

if __name__ == "__main__":
    main()
