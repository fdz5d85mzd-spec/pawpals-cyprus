import React, { useState, useMemo } from "react";
import {
  PawPrint, MapPin, Search, Dog, Cat, Scissors, Stethoscope,
  Home as HomeIcon, ChevronRight, Star, Check, Menu, X, Globe,
  Mail, Phone, ArrowRight
} from "lucide-react";

/* ---------------------------------------------------------------
   PawPals Cyprus — original concept site for a pet-sitting
   marketplace serving Cyprus. Design, copy and data are original;
   nothing here is copied from any existing business.
--------------------------------------------------------------- */

const DISTRICTS = [
  { id: "nicosia", el: "Λευκωσία", en: "Nicosia", path: "M150,40 L210,55 L225,100 L190,120 L140,110 Z" },
  { id: "kyrenia_note", el: "", en: "", path: "" }, // unused, kept out intentionally
  { id: "limassol", el: "Λεμεσός", en: "Limassol", path: "M120,180 L200,170 L230,210 L170,230 L110,215 Z" },
  { id: "larnaca", el: "Λάρνακα", en: "Larnaca", path: "M225,100 L270,110 L275,150 L230,160 L215,125 Z" },
  { id: "paphos", el: "Πάφος", en: "Paphos", path: "M30,140 L110,150 L120,200 L60,215 L20,180 Z" },
  { id: "famagusta", el: "Αμμόχωστος", en: "Famagusta", path: "M270,95 L310,90 L320,120 L280,135 L268,112 Z" },
];

const SITTERS = [
  { id: 1, name: "Ελένη Χ.", district: "limassol", rating: 4.9, reviews: 62, services: ["boarding", "walking"], pets: ["dog", "cat"], price: 18, img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&h=200&fit=crop" },
  { id: 2, name: "Ανδρέας Π.", district: "nicosia", rating: 5.0, reviews: 41, services: ["walking", "vet"], pets: ["dog"], price: 12, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop" },
  { id: 3, name: "Μαρία Κ.", district: "larnaca", rating: 4.8, reviews: 89, services: ["grooming", "boarding"], pets: ["dog", "cat", "rabbit"], price: 22, img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop" },
  { id: 4, name: "Γιώργος Σ.", district: "paphos", rating: 4.7, reviews: 34, services: ["walking", "boarding"], pets: ["dog"], price: 15, img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop" },
  { id: 5, name: "Χριστίνα Δ.", district: "famagusta", rating: 5.0, reviews: 27, services: ["vet", "grooming"], pets: ["cat"], price: 20, img: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=200&h=200&fit=crop" },
  { id: 6, name: "Νίκος Ι.", district: "limassol", rating: 4.9, reviews: 55, services: ["boarding", "vet"], pets: ["dog", "cat"], price: 19, img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop" },
];

const SERVICES = [
  { id: "boarding", icon: HomeIcon, el: { name: "Φιλοξενία", desc: "Το κατοικίδιό σου μένει σε ένα σπίτι με φροντίδα, όσο λείπεις." }, en: { name: "Boarding", desc: "Your pet stays in a cared-for home while you're away." } },
  { id: "walking", icon: Dog, el: { name: "Σκυλοβόλτα", desc: "Καθημερινές βόλτες και παιχνίδι από κάποιον κοντά σου." }, en: { name: "Dog walking", desc: "Daily walks and playtime from someone nearby." } },
  { id: "grooming", icon: Scissors, el: { name: "Grooming", desc: "Μπάνιο, κούρεμα και περιποίηση, στο σπίτι ή κοντά." }, en: { name: "Grooming", desc: "Bathing, trims and care, at home or nearby." } },
  { id: "vet", icon: Stethoscope, el: { name: "Συνοδεία σε κτηνίατρο", desc: "Κάποιος αναλαμβάνει τη μετάβαση και το ραντεβού." }, en: { name: "Vet visits", desc: "Someone handles the trip and the appointment." } },
];

const T = {
  el: {
    nav: ["Αρχική", "Υπηρεσίες", "Πώς λειτουργεί", "Γίνε φροντιστής"],
    login: "Σύνδεση",
    heroEyebrow: "Φροντί��α κατοικιδίων · σε όλη την Κύπρο",
    heroTitle: "Όσο λείπεις εσύ, κάποιος εδώ φροντίζει.",
    heroSub: "Βρες αξιόπιστους φροντιστές κοντά σου, σε Λευκωσία, Λεμεσό, Λάρνακα, Πάφο και Αμμόχωστο.",
    searchPet: "Κατοικίδιο",
    searchDistrict: "Επαρχία",
    searchService: "Υπηρεσία",
    searchBtn: "Αναζήτηση φροντιστών",
    anyDistrict: "Όλες οι επαρχίες",
    pets: { dog: "Σκύλος", cat: "Γάτα", rabbit: "Κουνέλι" },
    servicesTitle: "Οι υπηρεσίες μας",
    servicesSub: "Ό,τι χρειάζεται το κατοικίδιό σου, από ανθρώπους που το αγαπούν.",
    howTitle: "Πώς λειτουργεί",
    how: [
      { t: "Ψάξε", d: "Φίλτραρε φροντιστές με βάση περιοχή, υπηρεσία και είδος κατοικιδίου." },
      { t: "Κλείσε", d: "Στείλε μήνυμα, δες διαθεσιμότητα και κλείσε ημερομηνία." },
      { t: "Χαλάρωσε", d: "Λαμβάνει�� ενημερώσεις και φωτογραφίες όσο λείπεις." },
    ],
    sittersTitle: "Φροντιστές κοντά σου",
    sittersSub: "Μια μικρή γεύση από την κοινότητά μας.",
    perNight: "/ επίσκεψη",
    reviews: "αξιολογήσεις",
    becomeTitle: "Γίνε φροντιστής",
    becomeSub: "Αγαπάς τα ζώα; Κέρδισε φροντίζοντας κατοικίδια στην περιοχή σου, με το δικό σου πρόγραμμα.",
    formName: "Ονοματεπώνυμο",
    formEmail: "Email",
    formDistrict: "Επαρχία",
    formService: "Τι θα ήθελες να προσφέρεις",
    formMsg: "Πες μας λίγα λόγια για σένα",
    formSubmit: "Στείλε αίτηση",
    formSent: "Ευχαριστούμε! Θα επικοινωνήσουμε μαζί σου σύντομα.",
    contactTitle: "Επικοινωνία",
    contactSub: "Απορίες, προτάσεις ή θέμα με κράτηση; Είμαστε εδώ.",
    contactSend: "Αποστολή μηνύματος",
    footerTagline: "Μια κοινότητα φροντίδας κατοικιδίων, φτιαγμένη για την Κύπρο.",
    footerRights: "Όλα τα δικαιώματα διατηρούνται.",
    selectDistrictHint: "Πάτησε μια επαρχία στον χάρτη",
  },
  en: {
    nav: ["Home", "Services", "How it works", "Become a sitter"],
    login: "Log in",
    heroEyebrow: "Pet care · across Cyprus",
    heroTitle: "While you're away, someone here is caring.",
    heroSub: "Find trusted pet sitters near you, in Nicosia, Limassol, Larnaca, Paphos and Famagusta.",
    searchPet: "Pet",
    searchDistrict: "District",
    searchService: "Service",
    searchBtn: "Search sitters",
    anyDistrict: "All districts",
    pets: { dog: "Dog", cat: "Cat", rabbit: "Rabbit" },
    servicesTitle: "Our services",
    servicesSub: "Whatever your pet needs, from people who love animals.",
    howTitle: "How it works",
    how: [
      { t: "Search", d: "Filter sitters by area, service and pet type." },
      { t: "Book", d: "Message, check availability and lock in a date." },
      { t: "Relax", d: "Get updates and photos the whole time you're away." },
    ],
    sittersTitle: "Sitters near you",
    sittersSub: "A small taste of our community.",
    perNight: "/ visit",
    reviews: "reviews",
    becomeTitle: "Become a sitter",
    becomeSub: "Love animals? Earn money caring for pets in your area, on your own schedule.",
    formName: "Full name",
    formEmail: "Email",
    formDistrict: "District",
    formService: "What you'd like to offer",
    formMsg: "Tell us a bit about yourself",
    formSubmit: "Send application",
    formSent: "Thank you! We'll be in touch soon.",
    contactTitle: "Contact",
    contactSub: "Questions, ideas or a booking issue? We're here.",
    contactSend: "Send message",
    footerTagline: "A pet-care community, built for Cyprus.",
    footerRights: "All rights reserved.",
    selectDistrictHint: "Tap a district on the map",
  },
};

const PET_ICONS = { dog: Dog, cat: Cat, rabbit: PawPrint };

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
        active
          ? "bg-[#1B4B66] text-[#F7F4EC] border-[#1B4B66]"
          : "bg-transparent text-[#1B4B66] border-[#1B4B66]/30 hover:border-[#1B4B66]"
      }`}
    >
      {children}
    </button>
  );
}

export default function PawPalsCyprus() {
  const [lang, setLang] = useState("el");
  const [menuOpen, setMenuOpen] = useState(false);
  const [district, setDistrict] = useState("all");
  const [service, setService] = useState("all");
  const [pet, setPet] = useState("all");
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  const [appForm, setAppForm] = useState({ name: "", email: "", district: "", service: "", msg: "" });
  const [appSent, setAppSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", msg: "" });
  const [contactSent, setContactSent] = useState(false);

  const t = T[lang];
  const districts = DISTRICTS.filter((d) => d.id !== "kyrenia_note");

  const filteredSitters = useMemo(() => {
    return SITTERS.filter((s) => {
      if (district !== "all" && s.district !== district) return false;
      if (service !== "all" && !s.services.includes(service)) return false;
      if (pet !== "all" && !s.pets.includes(pet)) return false;
      return true;
    });
  }, [district, service, pet]);

  const districtName = (id) => {
    const d = districts.find((x) => x.id === id);
    return d ? d[lang] : "";
  };

  const submitApp = (e) => {
    e.preventDefault();
    setAppSent(true);
  };
  const submitContact = (e) => {
    e.preventDefault();
    setContactSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#1B2B33]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F7F4EC]/90 backdrop-blur border-b border-[#1B4B66]/10">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 font-display text-xl font-semibold text-[#1B4B66]">
            <PawPrint className="w-6 h-6 text-[#E08E45]" strokeWidth={2.5} />
            PawPals <span className="text-[#E08E45]">Cyprus</span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {t.nav.map((item, i) => (
              <a key={i} href={["#top", "#services", "#how", "#become"][i]} className="text-[#1B2B33]/80 hover:text-[#1B4B66] transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "el" ? "en" : "el")}
              className="flex items-center gap-1.5 text-sm font-medium text-[#1B4B66] border border-[#1B4B66]/30 rounded-full px-3 py-1.5 hover:bg-[#1B4B66]/5"
            >
              <Globe className="w-4 h-4" /> {lang === "el" ? "EN" : "EL"}
            </button>
            <button className="text-sm font-semibold bg-[#1B4B66] text-[#F7F4EC] rounded-full px-4 py-2 hover:bg-[#163C52] transition-colors">
              {t.login}
            </button>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-5 pb-4 flex flex-col gap-3 border-t border-[#1B4B66]/10 pt-3">
            {t.nav.map((item, i) => (
              <a key={i} href={["#top", "#services", "#how", "#become"][i]} onClick={() => setMenuOpen(false)} className="text-sm font-medium">
                {item}
              </a>
            ))}
            <button
              onClick={() => setLang(lang === "el" ? "en" : "el")}
              className="flex items-center gap-1.5 text-sm font-medium text-[#1B4B66] self-start"
            >
              <Globe className="w-4 h-4" /> {lang === "el" ? "English" : "Ελληνικά"}
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden bg-[#1B4B66] text-[#F7F4EC]">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#E08E45] mb-4">
              {t.heroEyebrow}
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold leading-[1.1] mb-5">
              {t.heroTitle}
            </h1>
            <p className="text-[#F7F4EC]/80 text-lg mb-8 max-w-md">{t.heroSub}</p>

            {/* Search card */}
            <div className="bg-[#F7F4EC] text-[#1B2B33] rounded-2xl p-5 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.searchPet}</label>
                  <select value={pet} onChange={(e) => setPet(e.target.value)} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="all">{lang === "el" ? "Όλα" : "All"}</option>
                    <option value="dog">{t.pets.dog}</option>
                    <option value="cat">{t.pets.cat}</option>
                    <option value="rabbit">{t.pets.rabbit}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.searchDistrict}</label>
                  <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="all">{t.anyDistrict}</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d[lang]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.searchService}</label>
                  <select value={service} onChange={(e) => setService(e.target.value)} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="all">{lang === "el" ? "Όλες" : "All"}</option>
                    {SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>{s[lang].name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <a href="#sitters" className="w-full flex items-center justify-center gap-2 bg-[#E08E45] text-[#1B2B33] font-semibold rounded-lg py-2.5 hover:bg-[#CB7C36] transition-colors">
                <Search className="w-4 h-4" /> {t.searchBtn}
              </a>
            </div>
          </div>

          {/* Signature: clickable stylised Cyprus district map */}
          <div className="relative">
            <p className="text-sm text-[#F7F4EC]/60 mb-2 text-center md:text-right">{t.selectDistrictHint}</p>
            <svg viewBox="0 0 340 250" className="w-full h-auto max-w-md mx-auto">
              {districts.map((d) => (
                <path
                  key={d.id}
                  d={d.path}
                  onClick={() => setDistrict(district === d.id ? "all" : d.id)}
                  onMouseEnter={() => setHoveredDistrict(d.id)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  className="cursor-pointer transition-all"
                  fill={district === d.id ? "#E08E45" : hoveredDistrict === d.id ? "#3D6E8A" : "#26597A"}
                  stroke="#F7F4EC"
                  strokeWidth="2"
                />
              ))}
              {districts.map((d) => {
                const match = d.path.match(/M([\d.]+),([\d.]+)/);
                const [x, y] = match ? [parseFloat(match[1]), parseFloat(match[2])] : [0, 0];
                return (
                  <text key={d.id + "-label"} x={x + 30} y={y + 40} fontSize="11" fill="#F7F4EC" className="pointer-events-none select-none font-medium">
                    {d[lang]}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-6xl mx-auto px-5 md:px-8 py-20">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-[#1B4B66] mb-3">{t.servicesTitle}</h2>
        <p className="text-[#1B2B33]/70 mb-10 max-w-lg">{t.servicesSub}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="bg-white rounded-2xl p-6 border border-[#1B4B66]/10 hover:shadow-lg transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-[#1B4B66]/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#1B4B66]" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1.5">{s[lang].name}</h3>
                <p className="text-sm text-[#1B2B33]/65">{s[lang].desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-[#EDE6D6] py-20">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-[#1B4B66] mb-10">{t.howTitle}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {t.how.map((step, i) => (
              <div key={i} className="relative">
                <span className="font-display text-5xl font-semibold text-[#E08E45]/40">0{i + 1}</span>
                <h3 className="font-display text-xl font-semibold mt-2 mb-2 text-[#1B4B66]">{step.t}</h3>
                <p className="text-sm text-[#1B2B33]/70">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sitters */}
      <section id="sitters" className="max-w-6xl mx-auto px-5 md:px-8 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-[#1B4B66] mb-2">{t.sittersTitle}</h2>
            <p className="text-[#1B2B33]/70">{t.sittersSub}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill active={district === "all"} onClick={() => setDistrict("all")}>{t.anyDistrict}</Pill>
            {districts.map((d) => (
              <Pill key={d.id} active={district === d.id} onClick={() => setDistrict(d.id)}>{d[lang]}</Pill>
            ))}
          </div>
        </div>

        {filteredSitters.length === 0 ? (
          <div className="text-center py-16 text-[#1B2B33]/60">
            {lang === "el" ? "Δεν βρέθηκαν φροντιστές με αυτά τα φίλτρα." : "No sitters match these filters."}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSitters.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl overflow-hidden border border-[#1B4B66]/10 hover:shadow-lg transition-shadow">
                <img src={s.img} alt={s.name} className="w-full h-40 object-cover" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-semibold text-lg">{s.name}</h3>
                    <span className="flex items-center gap-1 text-sm font-medium text-[#1B4B66]">
                      <Star className="w-3.5 h-3.5 fill-[#E08E45] text-[#E08E45]" /> {s.rating}
                    </span>
                  </div>
                  <p className="text-xs text-[#1B2B33]/55 mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {districtName(s.district)} · {s.reviews} {t.reviews}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    {s.pets.map((p) => {
                      const Icon = PET_ICONS[p];
                      return <Icon key={p} className="w-4 h-4 text-[#1B4B66]/50" />;
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-semibold text-[#1B4B66]">
                      €{s.price}<span className="text-xs font-normal text-[#1B2B33]/50">{t.perNight}</span>
                    </span>
                    <button className="text-sm font-semibold text-[#E08E45] flex items-center gap-1 hover:gap-1.5 transition-all">
                      {lang === "el" ? "Προβολή" : "View"} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Become a sitter */}
      <section id="become" className="bg-[#1B4B66] text-[#F7F4EC] py-20">
        <div className="max-w-4xl mx-auto px-5 md:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">{t.becomeTitle}</h2>
          <p className="text-[#F7F4EC]/75 mb-8 max-w-lg">{t.becomeSub}</p>

          {appSent ? (
            <div className="bg-[#F7F4EC] text-[#1B2B33] rounded-2xl p-6 flex items-center gap-3">
              <Check className="w-5 h-5 text-[#6B7A4F]" /> {t.formSent}
            </div>
          ) : (
            <form onSubmit={submitApp} className="bg-[#F7F4EC] text-[#1B2B33] rounded-2xl p-6 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.formName}</label>
                <input required value={appForm.name} onChange={(e) => setAppForm({ ...appForm, name: e.target.value })} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.formEmail}</label>
                <input required type="email" value={appForm.email} onChange={(e) => setAppForm({ ...appForm, email: e.target.value })} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.formDistrict}</label>
                <select required value={appForm.district} onChange={(e) => setAppForm({ ...appForm, district: e.target.value })} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="" disabled>—</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d[lang]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.formService}</label>
                <select required value={appForm.service} onChange={(e) => setAppForm({ ...appForm, service: e.target.value })} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="" disabled>—</option>
                  {SERVICES.map((s) => <option key={s.id} value={s.id}>{s[lang].name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.formMsg}</label>
                <textarea rows={3} value={appForm.msg} onChange={(e) => setAppForm({ ...appForm, msg: e.target.value })} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="sm:col-span-2 flex items-center justify-center gap-2 bg-[#E08E45] text-[#1B2B33] font-semibold rounded-lg py-2.5 hover:bg-[#CB7C36] transition-colors">
                {t.formSubmit} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-4xl mx-auto px-5 md:px-8 py-20">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-[#1B4B66] mb-3">{t.contactTitle}</h2>
        <p className="text-[#1B2B33]/70 mb-8">{t.contactSub}</p>

        {contactSent ? (
          <div className="bg-[#EDE6D6] rounded-2xl p-6 flex items-center gap-3">
            <Check className="w-5 h-5 text-[#6B7A4F]" /> {t.formSent}
          </div>
        ) : (
          <form onSubmit={submitContact} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.formName}</label>
              <input required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.formEmail}</label>
              <input required type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#1B2B33]/60 mb-1 block">{t.formMsg}</label>
              <textarea required rows={4} value={contactForm.msg} onChange={(e) => setContactForm({ ...contactForm, msg: e.target.value })} className="w-full border border-[#1B4B66]/20 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="sm:col-span-2 flex items-center justify-center gap-2 bg-[#1B4B66] text-[#F7F4EC] font-semibold rounded-lg py-2.5 hover:bg-[#163C52] transition-colors">
              {t.contactSend} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-[#12333F] text-[#F7F4EC]/80 py-12">
        <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-[#F7F4EC] mb-2">
              <PawPrint className="w-5 h-5 text-[#E08E45]" /> PawPals Cyprus
            </div>
            <p className="text-sm max-w-xs">{t.footerTagline}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@pawpals.cy</span>
            <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> +357 25 000 000</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-5 md:px-8 mt-8 pt-6 border-t border-[#F7F4EC]/10 text-xs">
          © {new Date().getFullYear()} PawPals Cyprus. {t.footerRights}
        </div>
      </footer>
    </div>
  );
}
