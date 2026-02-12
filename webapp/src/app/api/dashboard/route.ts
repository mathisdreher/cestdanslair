import { NextResponse } from "next/server";
import { loadVideos, getYearFromDate, parseDuration, SKIP_TAGS } from "@/lib/data";

export async function GET() {
  const videos = loadVideos();

  const totalVideos = videos.length;
  const totalViews = videos.reduce((s, v) => s + v.view_count, 0);
  const totalLikes = videos.reduce((s, v) => s + v.like_count, 0);
  const totalComments = videos.reduce((s, v) => s + v.comment_count, 0);
  const avgViews = Math.round(totalViews / totalVideos);
  const totalHours = Math.round(videos.reduce((s, v) => s + parseDuration(v.duration), 0) / 3600);

  // Date range
  const dates = videos.map((v) => new Date(v.published_at).getTime());
  const firstDate = new Date(Math.min(...dates)).toISOString();
  const lastDate = new Date(Math.max(...dates)).toISOString();

  // Videos per year (with all metrics)
  const yearlyMap: Record<number, { count: number; views: number; likes: number; comments: number; totalDuration: number }> = {};
  videos.forEach((v) => {
    const year = getYearFromDate(v.published_at);
    if (!yearlyMap[year]) yearlyMap[year] = { count: 0, views: 0, likes: 0, comments: 0, totalDuration: 0 };
    yearlyMap[year].count++;
    yearlyMap[year].views += v.view_count;
    yearlyMap[year].likes += v.like_count;
    yearlyMap[year].comments += v.comment_count;
    yearlyMap[year].totalDuration += parseDuration(v.duration);
  });
  const yearly = Object.entries(yearlyMap)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([year, data]) => ({
      year: parseInt(year),
      ...data,
      avgViews: Math.round(data.views / data.count),
      engagement: data.views > 0 ? +((data.likes + data.comments) / data.views * 100).toFixed(2) : 0,
      hoursOfContent: Math.round(data.totalDuration / 3600),
    }));

  // Duration distribution
  const durationBuckets: Record<string, number> = {
    "30-45 min": 0, "45-60 min": 0, "60-75 min": 0, "75-90 min": 0, "90+ min": 0,
  };
  videos.forEach((v) => {
    const mins = parseDuration(v.duration) / 60;
    if (mins < 45) durationBuckets["30-45 min"]++;
    else if (mins < 60) durationBuckets["45-60 min"]++;
    else if (mins < 75) durationBuckets["60-75 min"]++;
    else if (mins < 90) durationBuckets["75-90 min"]++;
    else durationBuckets["90+ min"]++;
  });
  const durationDistribution = Object.entries(durationBuckets).map(([range, count]) => ({ range, count }));

  // Top 20 viewed
  const topVideos = [...videos]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 20)
    .map((v) => ({
      title: v.title,
      views: v.view_count,
      likes: v.like_count,
      comments: v.comment_count,
      published_at: v.published_at,
      url: v.url,
    }));

  // Top tags (quick overview)
  const tagCounts: Record<string, number> = {};
  videos.forEach((v) => {
    v.tags.forEach((t) => {
      const nt = t.toLowerCase().trim();
      if (!nt || SKIP_TAGS.has(nt)) return;
      tagCounts[nt] = (tagCounts[nt] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Geographic coverage - countries/regions mentioned with ISO codes + search terms
  const geoKeywords: { keywords: string[]; name: string; iso: string; searchTerm: string }[] = [
    { keywords: ["france"], name: "France", iso: "FRA", searchTerm: "france" },
    { keywords: ["états-unis", "usa", "etats-unis", "amérique", "trump", "biden", "washington"], name: "États-Unis", iso: "USA", searchTerm: "états-unis" },
    { keywords: ["chine", "pékin", "xi jinping"], name: "Chine", iso: "CHN", searchTerm: "chine" },
    { keywords: ["russie", "moscou", "poutine", "kremlin"], name: "Russie", iso: "RUS", searchTerm: "russie" },
    { keywords: ["ukraine", "kiev", "zelensky"], name: "Ukraine", iso: "UKR", searchTerm: "ukraine" },
    { keywords: ["allemagne", "berlin", "merkel", "scholz"], name: "Allemagne", iso: "DEU", searchTerm: "allemagne" },
    { keywords: ["royaume-uni", "angleterre", "brexit", "londres"], name: "Royaume-Uni", iso: "GBR", searchTerm: "royaume-uni" },
    { keywords: ["italie", "rome", "meloni"], name: "Italie", iso: "ITA", searchTerm: "italie" },
    { keywords: ["espagne", "madrid"], name: "Espagne", iso: "ESP", searchTerm: "espagne" },
    { keywords: ["iran", "téhéran"], name: "Iran", iso: "IRN", searchTerm: "iran" },
    { keywords: ["israël", "israel", "netanyahu", "tel-aviv"], name: "Israël", iso: "ISR", searchTerm: "israël" },
    { keywords: ["palestine", "gaza", "hamas", "cisjordanie"], name: "Palestine", iso: "PSE", searchTerm: "gaza" },
    { keywords: ["syrie", "damas", "assad"], name: "Syrie", iso: "SYR", searchTerm: "syrie" },
    { keywords: ["turquie", "ankara", "erdogan"], name: "Turquie", iso: "TUR", searchTerm: "turquie" },
    { keywords: ["japon", "tokyo"], name: "Japon", iso: "JPN", searchTerm: "japon" },
    { keywords: ["corée", "coree", "pyongyang", "séoul"], name: "Corée", iso: "KOR", searchTerm: "corée" },
    { keywords: ["inde", "modi", "delhi"], name: "Inde", iso: "IND", searchTerm: "inde" },
    { keywords: ["brésil", "bresil", "brasilia"], name: "Brésil", iso: "BRA", searchTerm: "brésil" },
    { keywords: ["mexique", "mexico"], name: "Mexique", iso: "MEX", searchTerm: "mexique" },
    { keywords: ["canada", "ottawa", "trudeau"], name: "Canada", iso: "CAN", searchTerm: "canada" },
    { keywords: ["australie", "sydney"], name: "Australie", iso: "AUS", searchTerm: "australie" },
    { keywords: ["algérie", "algerie", "alger"], name: "Algérie", iso: "DZA", searchTerm: "algérie" },
    { keywords: ["maroc", "rabat"], name: "Maroc", iso: "MAR", searchTerm: "maroc" },
    { keywords: ["tunisie", "tunis"], name: "Tunisie", iso: "TUN", searchTerm: "tunisie" },
    { keywords: ["liban", "beyrouth", "hezbollah"], name: "Liban", iso: "LBN", searchTerm: "liban" },
    { keywords: ["irak", "bagdad"], name: "Irak", iso: "IRQ", searchTerm: "irak" },
    { keywords: ["afghanistan", "kaboul", "taliban"], name: "Afghanistan", iso: "AFG", searchTerm: "afghanistan" },
    { keywords: ["groenland"], name: "Groenland", iso: "GRL", searchTerm: "groenland" },
    { keywords: ["pologne", "varsovie"], name: "Pologne", iso: "POL", searchTerm: "pologne" },
    { keywords: ["grèce", "grece", "athènes"], name: "Grèce", iso: "GRC", searchTerm: "grèce" },
    { keywords: ["belgique", "bruxelles"], name: "Belgique", iso: "BEL", searchTerm: "belgique" },
    { keywords: ["libye", "tripoli"], name: "Libye", iso: "LBY", searchTerm: "libye" },
    { keywords: ["mali", "bamako"], name: "Mali", iso: "MLI", searchTerm: "mali" },
    { keywords: ["niger"], name: "Niger", iso: "NER", searchTerm: "niger" },
    { keywords: ["soudan", "khartoum"], name: "Soudan", iso: "SDN", searchTerm: "soudan" },
    { keywords: ["venezuela", "caracas", "maduro"], name: "Venezuela", iso: "VEN", searchTerm: "venezuela" },
    { keywords: ["arabie saoudite", "riyad"], name: "Arabie Saoudite", iso: "SAU", searchTerm: "arabie saoudite" },
    { keywords: ["qatar", "doha"], name: "Qatar", iso: "QAT", searchTerm: "qatar" },
    { keywords: ["égypte", "egypte", "caire"], name: "Égypte", iso: "EGY", searchTerm: "égypte" },
    { keywords: ["pakistan", "islamabad"], name: "Pakistan", iso: "PAK", searchTerm: "pakistan" },
    { keywords: ["finlande", "helsinki"], name: "Finlande", iso: "FIN", searchTerm: "finlande" },
    { keywords: ["argentine", "buenos aires", "milei"], name: "Argentine", iso: "ARG", searchTerm: "argentine" },
    { keywords: ["suède", "suede", "stockholm"], name: "Suède", iso: "SWE", searchTerm: "suède" },
    { keywords: ["portugal", "lisbonne"], name: "Portugal", iso: "PRT", searchTerm: "portugal" },
    { keywords: ["pays-bas", "pays bas", "hollande", "amsterdam"], name: "Pays-Bas", iso: "NLD", searchTerm: "pays-bas" },
    { keywords: ["autriche", "vienne"], name: "Autriche", iso: "AUT", searchTerm: "autriche" },
    { keywords: ["hongrie", "budapest", "orban"], name: "Hongrie", iso: "HUN", searchTerm: "hongrie" },
    { keywords: ["irlande", "dublin"], name: "Irlande", iso: "IRL", searchTerm: "irlande" },
    { keywords: ["roumanie", "bucarest"], name: "Roumanie", iso: "ROU", searchTerm: "roumanie" },
    { keywords: ["serbie", "belgrade"], name: "Serbie", iso: "SRB", searchTerm: "serbie" },
    { keywords: ["croatie", "zagreb"], name: "Croatie", iso: "HRV", searchTerm: "croatie" },
    { keywords: ["norvège", "norvege", "oslo"], name: "Norvège", iso: "NOR", searchTerm: "norvège" },
    { keywords: ["danemark", "copenhague"], name: "Danemark", iso: "DNK", searchTerm: "danemark" },
    { keywords: ["suisse", "berne", "genève"], name: "Suisse", iso: "CHE", searchTerm: "suisse" },
    { keywords: ["tchéquie", "tchequie", "prague", "république tchèque"], name: "Tchéquie", iso: "CZE", searchTerm: "prague" },
    { keywords: ["colombie", "bogota"], name: "Colombie", iso: "COL", searchTerm: "colombie" },
    { keywords: ["chili", "santiago"], name: "Chili", iso: "CHL", searchTerm: "chili" },
    { keywords: ["pérou", "perou", "lima"], name: "Pérou", iso: "PER", searchTerm: "pérou" },
    { keywords: ["cuba", "havane"], name: "Cuba", iso: "CUB", searchTerm: "cuba" },
    { keywords: ["éthiopie", "ethiopie", "addis"], name: "Éthiopie", iso: "ETH", searchTerm: "éthiopie" },
    { keywords: ["nigeria", "abuja", "lagos"], name: "Nigeria", iso: "NGA", searchTerm: "nigeria" },
    { keywords: ["sénégal", "senegal", "dakar"], name: "Sénégal", iso: "SEN", searchTerm: "sénégal" },
    { keywords: ["cameroun", "yaoundé"], name: "Cameroun", iso: "CMR", searchTerm: "cameroun" },
    { keywords: ["kenya", "nairobi"], name: "Kenya", iso: "KEN", searchTerm: "kenya" },
    { keywords: ["géorgie", "georgie", "tbilissi"], name: "Géorgie", iso: "GEO", searchTerm: "géorgie" },
    { keywords: ["biélorussie", "bielorussie", "belarus", "minsk", "loukachenko"], name: "Biélorussie", iso: "BLR", searchTerm: "biélorussie" },
    { keywords: ["moldavie", "chisinau"], name: "Moldavie", iso: "MDA", searchTerm: "moldavie" },
    { keywords: ["taïwan", "taiwan", "taipei"], name: "Taïwan", iso: "TWN", searchTerm: "taïwan" },
    { keywords: ["birmanie", "myanmar"], name: "Birmanie", iso: "MMR", searchTerm: "birmanie" },
    { keywords: ["thaïlande", "thailande", "bangkok"], name: "Thaïlande", iso: "THA", searchTerm: "thaïlande" },
    { keywords: ["vietnam", "hanoï", "hanoi"], name: "Vietnam", iso: "VNM", searchTerm: "vietnam" },
    { keywords: ["cambodge", "phnom penh"], name: "Cambodge", iso: "KHM", searchTerm: "cambodge" },
    { keywords: ["philippines", "manille"], name: "Philippines", iso: "PHL", searchTerm: "philippines" },
    { keywords: ["indonésie", "indonesie", "jakarta"], name: "Indonésie", iso: "IDN", searchTerm: "indonésie" },
    { keywords: ["yémen", "yemen", "sanaa", "houthis", "houthi"], name: "Yémen", iso: "YEM", searchTerm: "yémen" },
    { keywords: ["jordanie", "amman"], name: "Jordanie", iso: "JOR", searchTerm: "jordanie" },
    { keywords: ["émirats", "emirats", "dubaï", "dubai", "abu dhabi"], name: "Émirats arabes unis", iso: "ARE", searchTerm: "émirats" },
    { keywords: ["burkina faso", "ouagadougou"], name: "Burkina Faso", iso: "BFA", searchTerm: "burkina faso" },
    { keywords: ["madagascar", "antananarivo"], name: "Madagascar", iso: "MDG", searchTerm: "madagascar" },
    { keywords: ["côte d'ivoire", "cote d'ivoire", "abidjan"], name: "Côte d'Ivoire", iso: "CIV", searchTerm: "côte d'ivoire" },
    { keywords: ["centrafrique", "bangui", "centrafricaine"], name: "Centrafrique", iso: "CAF", searchTerm: "centrafrique" },
    { keywords: ["somalie", "mogadiscio"], name: "Somalie", iso: "SOM", searchTerm: "somalie" },
    { keywords: ["bolivie", "la paz"], name: "Bolivie", iso: "BOL", searchTerm: "bolivie" },
  ];

  const geoCounts: Record<string, { count: number; iso: string; searchTerm: string }> = {};
  // Pre-compile regexes with word boundaries to avoid false positives
  // (e.g. "lima" in "climat", "mali" in "anomalie", "niger" in "nigeria")
  const geoRegexes = geoKeywords.map((geo) => ({
    ...geo,
    patterns: geo.keywords.map((kw) => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")),
  }));
  videos.forEach((v) => {
    const combinedText = `${v.title} ${v.tags.join(" ")} ${v.description}`.toLowerCase();
    geoRegexes.forEach((geo) => {
      const matched = geo.patterns.some((re) => re.test(combinedText));
      if (matched) {
        if (!geoCounts[geo.name]) geoCounts[geo.name] = { count: 0, iso: geo.iso, searchTerm: geo.searchTerm };
        geoCounts[geo.name].count++;
      }
    });
  });

  const geoData = Object.entries(geoCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([region, data]) => ({
      region,
      count: data.count,
      iso: data.iso,
      searchTerm: data.searchTerm,
      percentage: ((data.count / totalVideos) * 100).toFixed(1),
    }));

  return NextResponse.json({
    stats: { totalVideos, totalViews, totalLikes, totalComments, avgViews, totalHours, firstDate, lastDate },
    yearly,
    durationDistribution,
    topVideos,
    topTags,
    geoData,
  });
}
