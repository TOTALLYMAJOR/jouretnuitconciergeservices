"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, BookOpen, Check, ChevronDown, Compass, FileCheck2, Layers3, Menu, Pause, Play, Route, ShieldCheck, Sparkles, TrendingUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const services = [
  { icon: BarChart3, label: "Financial credibility", title: "Business Credit Consulting", href: "/services/business-credit", copy: "Understand your current profile, close readiness gaps, and approach financing conversations with stronger documentation and clearer expectations." },
  { icon: FileCheck2, label: "Professional structure", title: "Documents & Filing", href: "/services/documents-filing", copy: "Bring order to formation, registrations, core records, and compliance preparation with thoughtful administrative support." },
  { icon: BookOpen, label: "Confident leadership", title: "Business Education", href: "/services/business-education", copy: "Build the knowledge to make better decisions through practical coaching, workshops, resources, and strategic guidance." },
];

const steps = [
  { icon: Compass, n: "01", title: "Discover", copy: "We clarify the goal, review what exists, and identify the gaps that matter now." },
  { icon: Route, n: "02", title: "Strategize", copy: "We turn the findings into a focused, sequenced roadmap for your business." },
  { icon: Layers3, n: "03", title: "Execute", copy: "We help organize the work, prepare the materials, and move the plan forward." },
  { icon: TrendingUp, n: "04", title: "Grow", copy: "You move ahead with a stronger foundation and the confidence to maintain it." },
];

const faqs = [
  ["Can you guarantee funding or a credit result?", "No. We provide education, preparation, and strategic guidance. Approval decisions and terms remain with lenders, bureaus, agencies, and other third parties."],
  ["What happens in a strategy session?", "We clarify your goal, review the current state of the business, identify priority gaps, and outline sensible next steps. If our services fit, the scope is explained clearly before you commit."],
  ["Do you prepare and file business documents?", "We assist with administrative document preparation, registrations, filing coordination, and organization. The scope is confirmed before work begins. We are not a law firm and do not provide legal representation."],
  ["How long does the process take?", "Timing depends on scope, document availability, and third-party processing. You receive a realistic timeline before an engagement begins."],
];

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 26 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .16 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function Brand() {
  return <Link className="brand" href="/" aria-label="Jour et Nuit Concierge home"><span className="brand-mark">JN</span><span><strong>Jour et Nuit</strong><small>Concierge</small></span></Link>;
}

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [playing, setPlaying] = useState(true);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 20); fn(); addEventListener("scroll", fn, { passive: true }); return () => removeEventListener("scroll", fn); }, []);
  const toggleVideo = () => { if (!video.current) return; if (playing) video.current.pause(); else video.current.play(); setPlaying(!playing); };

  return <main id="top">
    <a className="skip-link" href="#content">Skip to content</a>
    <header className={scrolled ? "site-header scrolled" : "site-header"}><div className="nav-shell"><Brand />
      <nav className={menu ? "nav open" : "nav"} aria-label="Primary navigation">
        <a href="#services" onClick={() => setMenu(false)}>Services</a><a href="#approach" onClick={() => setMenu(false)}>Approach</a><a href="#process" onClick={() => setMenu(false)}>Process</a><a href="#faq" onClick={() => setMenu(false)}>FAQ</a>
      </nav>
      <div className="nav-actions"><Link className="button button-small" href="/consultation">Book a consultation <ArrowRight size={15}/></Link><button className="menu-button" onClick={() => setMenu(!menu)} aria-label={menu ? "Close menu" : "Open menu"}>{menu ? <X/> : <Menu/>}</button></div>
    </div></header>

    <section className="hero" aria-labelledby="hero-title">
      <video ref={video} className="hero-video" autoPlay muted loop playsInline poster="/founder-hero.png" aria-hidden="true"><source src="/executive-meeting.mp4" type="video/mp4" /></video>
      <div className="hero-overlay"/><div className="hero-lines"/>
      <div className="shell hero-inner">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9 }}>
          <p className="kicker"><Sparkles size={14}/> Business readiness, built with intention</p>
          <h1 id="hero-title">Build a business that earns <em>serious attention.</em></h1>
          <p className="hero-lede">Jour et Nuit helps entrepreneurs turn ambition into an organized, credible, and growth-ready business—through clear strategy and professional execution.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/consultation">Schedule a strategy session <ArrowRight size={18}/></Link><a className="button button-ghost" href="#services">Explore services</a></div>
          <div className="trust-row"><span><ShieldCheck size={15}/> Guidance, not guarantees</span><span><Check size={15}/> Clear, written scope</span><span><Check size={15}/> Practical next steps</span></div>
        </motion.div>
        <div className="hero-aside"><span>Strategic structure</span><strong>for entrepreneurs who are ready to operate differently.</strong></div>
      </div>
      <button className="video-control" onClick={toggleVideo} aria-label={playing ? "Pause background video" : "Play background video"}>{playing ? <Pause size={15}/> : <Play size={15}/>}<span>{playing ? "Pause film" : "Play film"}</span></button>
    </section>

    <div id="content">
      <section className="manifesto section"><div className="shell split"><Reveal><p className="kicker">Readiness changes the conversation</p><h2>Opportunity favors the business that is prepared to receive it.</h2></Reveal><Reveal className="body-copy"><p>A strong idea is only the beginning. When records are incomplete, responsibilities are unclear, or the business story is difficult to explain, the next opportunity becomes harder to pursue.</p><p>We help you replace uncertainty with structure—so you can enter important conversations informed, organized, and ready.</p><Link className="text-link" href="/assessment">Take the readiness assessment <ArrowRight size={16}/></Link></Reveal></div></section>

      <section id="services" className="section services"><div className="shell"><Reveal className="section-head"><p className="kicker">Three ways forward</p><h2>Expert support for the work behind the business.</h2><p>Every engagement begins with your actual priorities—not a one-size-fits-all package.</p></Reveal><div className="service-grid">{services.map((s, i) => <Reveal key={s.title} className="service-card"><span className="service-number">0{i+1}</span><s.icon className="service-icon"/><p className="card-label">{s.label}</p><h3>{s.title}</h3><p>{s.copy}</p><Link href={s.href}>Explore this service <ArrowRight size={16}/></Link></Reveal>)}</div></div></section>

      <section id="approach" className="section approach"><div className="shell approach-grid"><Reveal className="portrait"><Image src="/founder-hero.png" alt="Jour et Nuit Concierge business consultant" fill sizes="(max-width: 800px) 100vw, 45vw" unoptimized/><div className="portrait-note"><span>Jour et Nuit standard</span><strong>Thoughtful counsel. Disciplined execution.</strong></div></Reveal><Reveal className="approach-copy"><p className="kicker">Why Jour et Nuit</p><h2>High-touch guidance without the performance.</h2><p>You deserve a consultant who listens before prescribing, explains the reasoning, and treats your business with the care it requires.</p><div className="principles"><article><span>01</span><div><h3>Personalized direction</h3><p>Recommendations shaped by your stage, priorities, and capacity.</p></div></article><article><span>02</span><div><h3>Professional execution</h3><p>Clear deliverables, organized communication, and documented milestones.</p></div></article><article><span>03</span><div><h3>Practical education</h3><p>Context that helps you understand the work and maintain the foundation.</p></div></article></div></Reveal></div></section>

      <section id="process" className="section process"><div className="shell"><Reveal className="section-head"><p className="kicker">The success framework</p><h2>Clarity first. Momentum next.</h2></Reveal><div className="timeline">{steps.map(s => <Reveal className="step" key={s.title}><div className="step-top"><span>{s.n}</span><s.icon/></div><h3>{s.title}</h3><p>{s.copy}</p></Reveal>)}</div></div></section>

      <section className="section commercial-clarity"><div className="shell commercial-grid"><Reveal><p className="kicker">A responsible engagement</p><h2>Acceptance is not payment. Payment is not guesswork.</h2><p>Every client receives a written scope before a deposit is requested. Work begins only after the agreed proposal is accepted, the required deposit is verified, and the stated prerequisites are satisfied.</p><Link className="text-link" href="/engagement">See how engagements progress <ArrowRight size={16}/></Link></Reveal><Reveal className="truth-card"><div><span>01</span><strong>Proposal delivered</strong><small>Terms available for review</small></div><div><span>02</span><strong>Proposal accepted</strong><small>Agreement recorded</small></div><div><span>03</span><strong>Deposit verified</strong><small>Provider confirmation received</small></div><div><span>04</span><strong>Work authorized</strong><small>Onboarding may begin</small></div></Reveal></div></section>

      <section className="section assessment-cta"><div className="shell assessment-inner"><Reveal><p className="kicker">A useful place to begin</p><h2>How ready is your business for its next serious opportunity?</h2><p>Complete our short educational assessment to surface strengths, gaps, and the next questions worth asking.</p></Reveal><Reveal><Link className="button button-primary" href="/assessment">Start the assessment <ArrowRight size={17}/></Link><small>About 3 minutes · No sign-up required</small></Reveal></div></section>

      <section id="faq" className="section faq"><div className="shell faq-grid"><Reveal><p className="kicker">Straight answers</p><h2>Know what to expect.</h2><p>Responsible consulting begins with clear boundaries and realistic expectations.</p></Reveal><div className="faq-list">{faqs.map((f, i) => <div className="faq-item" key={f[0]}><button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}><span>{f[0]}</span><ChevronDown className={openFaq === i ? "rotated" : ""}/></button>{openFaq === i && <motion.p initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}>{f[1]}</motion.p>}</div>)}</div></div></section>

      <section className="final-cta"><div className="final-glow"/><div className="shell"><p className="kicker">Your next chapter</p><h2>Your business deserves more than good ideas. It deserves a strategic foundation.</h2><Link className="button button-primary" href="/consultation">Book your consultation <ArrowRight size={18}/></Link></div></section>
    </div>
    <footer><div className="shell footer-grid"><Brand/><p>Business readiness, professional documents, education, and growth strategy for entrepreneurs.</p><div><Link href="/assessment">Readiness assessment</Link><Link href="/consultation">Consultation</Link><Link href="/engagement">Engagement process</Link><Link href="/policies">Policies</Link><a href="#top">Back to top</a></div></div><div className="shell legal"><span>© {new Date().getFullYear()} Jour et Nuit Concierge</span><span>Business consulting and administrative support. Not legal or financial advice.</span></div></footer>
  </main>;
}
