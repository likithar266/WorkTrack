import React, { useEffect, useState } from "react"; // Import useState
import "../styles/landing.css"; // We will replace this CSS next
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// --- Import All Icons ---
import {
  FaSearch,
  FaArrowRight,
  FaStar,
  FaRegCheckCircle,
  FaBriefcase,
  FaUsers,
  FaFileAlt,
  FaHandshake,
  FaMoneyBillWave,
  FaQuoteLeft,
  FaApple,
  FaGoogle,
  FaMicrosoft,
  FaAmazon,
  FaPencilRuler,
  FaUserCheck,
} from "react-icons/fa"; // <-- FIX: react-icons (hyphen)
import {
  MdDesignServices,
  MdCode,
  MdVideoLibrary,
  MdRecordVoiceOver,
  MdOutlineDraw,
  MdBusinessCenter,
  MdTranslate,
  MdDataUsage,
} from "react-icons/md"; // <-- FIX: react-icons (hyphen)
// --- Animation Variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

// --- Helper Component for sections ---
const MotionSection = ({ children, className }) => (
  <motion.section
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    variants={staggerContainer}
  >
    {children}
  </motion.section>
);

// --- NEW: How It Works Component (with tabs) ---
const HowItWorksTabs = () => {
  const [activeTab, setActiveTab] = useState("client"); // 'client' or 'freelancer'

  return (
    <div className="how-it-works-container-v4">
      <motion.div className="how-it-works-tabs-v4" variants={fadeIn}>
        <button
          className={activeTab === "client" ? "active" : ""}
          onClick={() => setActiveTab("client")}
        >
          For Clients
        </button>
        <button
          className={activeTab === "freelancer" ? "active" : ""}
          onClick={() => setActiveTab("freelancer")}
        >
          For Freelancers
        </button>
      </motion.div>

      {/* --- Client Tab Content --- */}
      {activeTab === "client" && (
        <motion.div
          className="steps-grid-v4"
          key="client"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className="step-card-v4" variants={fadeIn}>
            <FaFileAlt className="step-icon-v4" />
            <h4>1. Post a job</h4>
            <p>Tell us what you need. It's free and takes just minutes.</p>
          </motion.div>
          <motion.div className="step-card-v4" variants={fadeIn}>
            <FaUsers className="step-icon-v4" />
            <h4>2. Get proposals</h4>
            <p>Receive bids from talented freelancers around the world.</p>
          </motion.div>
          <motion.div className="step-card-v4" variants={fadeIn}>
            <FaUserCheck className="step-icon-v4" />
            <h4>3. Hire your choice</h4>
            <p>Review proposals, chat, and hire your perfect match.</p>
          </motion.div>
          <motion.div className="step-card-v4" variants={fadeIn}>
            <FaMoneyBillWave className="step-icon-v4" />
            <h4>4. Pay securely</h4>
            <p>Pay only when the work is complete and you're 100% satisfied.</p>
          </motion.div>
        </motion.div>
      )}

      {/* --- Freelancer Tab Content --- */}
      {activeTab === "freelancer" && (
        <motion.div
          className="steps-grid-v4"
          key="freelancer"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className="step-card-v4" variants={fadeIn}>
            <FaBriefcase className="step-icon-v4" />
            <h4>1. Find work</h4>
            <p>
              Browse millions of jobs and find the one that fits your skills.
            </p>
          </motion.div>
          <motion.div className="step-card-v4" variants={fadeIn}>
            <FaPencilRuler className="step-icon-v4" />
            <h4>2. Send proposal</h4>
            <p>
              Write a compelling proposal to showcase why you're the best fit.
            </p>
          </motion.div>
          <motion.div className="step-card-v4" variants={fadeIn}>
            <FaHandshake className="step-icon-v4" />
            <h4>3. Get Hired</h4>
            <p>Collaborate with the client and deliver high-quality work.</p>
          </motion.div>
          <motion.div className="step-card-v4" variants={fadeIn}>
            <FaMoneyBillWave className="step-icon-v4" />
            <h4>4. Get Paid</h4>
            <p>Receive your earnings quickly and securely.</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// --- Main Landing Component ---
const Landing = () => {
  const navigate = useNavigate();

  // THIS IS YOUR ORIGINAL LOGIC - UNCHANGED
  useEffect(() => {
    if (localStorage.getItem("usertype") === "freelancer") {
      navigate("/freelancer");
    } else if (localStorage.getItem("usertype") === "client") {
      navigate("/client");
    } else if (localStorage.getItem("usertype") === "admin") {
      navigate("/admin");
    }
  }, [navigate]);

  return (
    <div className="landing-page-v4">
      {/* === 2. HERO SECTION (Freelancer.com inspired) === */}
      <section className="hero-section-v4">
        <div className="container-v4">
          <motion.h1 variants={fadeIn}>
            Hire the best freelancers for any job, online.
          </motion.h1>
          <motion.p className="hero-sub-v4" variants={fadeIn}>
            Millions of people use WorkTrack to turn their ideas into reality.
          </motion.p>

          <motion.div className="hero-buttons-v4" variants={fadeIn}>
            <button
              onClick={() => navigate("/authenticate")}
              className="btn-hero-hire-v4"
            >
              I want to Hire
            </button>
            <button
              onClick={() => navigate("/authenticate")}
              className="btn-hero-work-v4"
            >
              I want to Work
            </button>
          </motion.div>

          <motion.div className="hero-search-v4" variants={fadeIn}>
            <FaSearch className="search-icon-v4" />
            <input
              type="text"
              placeholder="Try 'MERN stack developer' or 'logo design'"
            />
            <button className="btn-search-v4">Search</button>
          </motion.div>
        </div>
      </section>

      {/* === 3. TRUSTED BY SECTION === */}
      <section className="trusted-by-v4">
        <div className="container-v4">
          <span>Trusted by:</span>
          <FaGoogle size={24} title="Google" />
          <FaMicrosoft size={24} title="Microsoft" />
          <FaAmazon size={24} title="Amazon" />
          <FaApple size={24} title="Apple" />
        </div>
      </section>

      {/* === 4. POPULAR SERVICES SECTION (Fiverr inspired) === */}
      <MotionSection className="popular-services-v4">
        <div className="container-v4">
          <motion.h2 variants={fadeIn}>Popular professional services</motion.h2>
          <motion.div className="service-grid-v4" variants={staggerContainer}>
            {/* You would map over real data here */}
            <motion.div
              className="service-card-v4"
              variants={fadeIn}
              style={{
                backgroundImage:
                  "url('https://images.pexels.com/photos/326503/pexels-photo-326503.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')",
              }}
            >
              <div className="card-content-v4">
                <span>Build your website</span>
                <h4>Web Development</h4>
              </div>
            </motion.div>
            <motion.div
              className="service-card-v4"
              variants={fadeIn}
              style={{
                backgroundImage:
                  "url('https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')",
              }}
            >
              <div className="card-content-v4">
                <span>Design your brand</span>
                <h4>Logo Design</h4>
              </div>
            </motion.div>
            <motion.div
              className="service-card-v4"
              variants={fadeIn}
              style={{
                backgroundImage:
                  "url('https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')",
              }}
            >
              <div className="card-content-v4">
                <span>Create custom art</span>
                <h4>AI Artists</h4>
              </div>
            </motion.div>
            <motion.div
              className="service-card-v4"
              variants={fadeIn}
              style={{
                backgroundImage:
                  "url('https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')",
              }}
            >
              <div className="card-content-v4">
                <span>Tell your story</span>
                <h4>Voice Over</h4>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </MotionSection>

      {/* === 5. VALUE PROPOSITION SECTION (Upwork inspired) === */}
      <MotionSection className="value-prop-v4">
        <div className="container-v4 value-prop-container">
          <div className="value-text-v4">
            <motion.h2 variants={fadeIn}>
              A whole world of freelance
              <br />
              talent at your fingertips
            </motion.h2>
            <motion.ul variants={staggerContainer}>
              <motion.li variants={fadeIn}>
                <FaRegCheckCircle className="check-icon-v4" />
                <div>
                  <h5>The best for every budget</h5>
                  <p>
                    Find high-quality services at every price point. No hourly
                    rates, just project-based pricing.
                  </p>
                </div>
              </motion.li>
              <motion.li variants={fadeIn}>
                <FaRegCheckCircle className="check-icon-v4" />
                <div>
                  <h5>Quality work done quickly</h5>
                  <p>
                    Find the right freelancer to begin working on your project
                    within minutes.
                  </p>
                </div>
              </motion.li>
              <motion.li variants={fadeIn}>
                <FaRegCheckCircle className="check-icon-v4" />
                <div>
                  <h5>Protected payments, every time</h5>
                  <p>
                    Always know what you'll pay upfront. Your payment isn't
                    released until you approve the work.
                  </p>
                </div>
              </motion.li>
            </motion.ul>
          </div>
          <motion.div className="value-image-v4" variants={fadeIn}>
            <img
              src="https://us.v-cdn.net/6036147/uploads/3TJLHA57SA4D/l-20-2-1200x675.jpg"
              className="freelancer-img-v4"
            />
          </motion.div>
        </div>
      </MotionSection>

      {/* === 6. EXPLORE MARKETPLACE SECTION === */}
      <MotionSection className="explore-market-v4">
        <div className="container-v4">
          <motion.h2 variants={fadeIn}>Explore the marketplace</motion.h2>
          <motion.div className="explore-grid-v4" variants={staggerContainer}>
            <motion.div className="explore-card-v4" variants={fadeIn}>
              <MdDesignServices size={40} />
              <h4>Graphics & Design</h4>
            </motion.div>
            <motion.div className="explore-card-v4" variants={fadeIn}>
              <MdCode size={40} />
              <h4>Programming & Tech</h4>
            </motion.div>
            {/* ... other cards ... */}
            <motion.div className="explore-card-v4" variants={fadeIn}>
              <MdBusinessCenter size={40} />
              <h4>Business</h4>
            </motion.div>
            <motion.div className="explore-card-v4" variants={fadeIn}>
              <MdTranslate size={40} />
              <h4>Writing & Translation</h4>
            </motion.div>
            <motion.div className="explore-card-v4" variants={fadeIn}>
              <MdVideoLibrary size={40} />
              <h4>Video & Animation</h4>
            </motion.div>
            <motion.div className="explore-card-v4" variants={fadeIn}>
              <MdRecordVoiceOver size={40} />
              <h4>Music & Audio</h4>
            </motion.div>
            <motion.div className="explore-card-v4" variants={fadeIn}>
              <MdOutlineDraw size={40} />
              <h4>AI Services</h4>
            </motion.div>
            <motion.div className="explore-card-v4" variants={fadeIn}>
              <MdDataUsage size={40} />
              <h4>Data</h4>
            </motion.div>
          </motion.div>
        </div>
      </MotionSection>

      {/* === 7. HOW IT WORKS (NEW TABBED VERSION) === */}
      <MotionSection className="how-it-works-v4">
        <div className="container-v4">
          <motion.h2 variants={fadeIn}>How it works</motion.h2>
          <HowItWorksTabs />
        </div>
      </MotionSection>

      {/* === 8. NEW: BROWSE PROJECTS (Freelancer.com inspired) === */}
      <MotionSection className="browse-jobs-v4">
        <div className="container-v4">
          <motion.h2 variants={fadeIn}>Latest projects posted</motion.h2>
          <motion.div className="job-card-grid-v4" variants={staggerContainer}>
            {/* You would map over real job data here */}
            <motion.div className="job-card-v4" variants={fadeIn}>
              <h4>Need a MERN Stack Developer for E-commerce Site</h4>
              <p>
                Looking for an expert developer to build a full-stack e-commerce
                platform with React, Node.js, and MongoDB...
              </p>
              <div className="job-tags-v4">
                <span>React</span>
                <span>Node.js</span>
                <span>MongoDB</span>
              </div>
              <div className="job-footer-v4">
                <span className="job-price-v4">$1,500 - $3,000</span>
                <button className="btn-bid-v4">Bid Now</button>
              </div>
            </motion.div>
            <motion.div className="job-card-v4" variants={fadeIn}>
              <h4>Logo Design for a new Tech Startup</h4>
              <p>
                We need a modern, minimalist logo for our new tech company
                "CloudFlow". Looking for creative concepts...
              </p>
              <div className="job-tags-v4">
                <span>Logo Design</span>
                <span>Branding</span>
                <span>Illustrator</span>
              </div>
              <div className="job-footer-v4">
                <span className="job-price-v4">$250 - $500</span>
                <button className="btn-bid-v4">Bid Now</button>
              </div>
            </motion.div>
            <motion.div className="job-card-v4" variants={fadeIn}>
              <h4>SEO Content Writer for a Travel Blog</h4>
              <p>
                Seeking an experienced content writer to create 10 high-quality,
                SEO-optimized blog posts about travel in Southeast Asia...
              </p>
              <div className="job-tags-v4">
                <span>Content Writing</span>
                <span>SEO</span>
                <span>Travel</span>
              </div>
              <div className="job-footer-v4">
                <span className="job-price-v4">$500</span>
                <button className="btn-bid-v4">Bid Now</button>
              </div>
            </motion.div>
          </motion.div>
          <motion.div className="browse-all-v4" variants={fadeIn}>
            <button className="btn-browse-all-v4">
              Browse All Projects <FaArrowRight />
            </button>
          </motion.div>
        </div>
      </MotionSection>

      {/* === 9. TESTIMONIAL SECTION === */}
      <MotionSection className="testimonial-v4">
        <div className="container-v4 testimonial-container">
          <motion.div className="testimonial-video-v4" variants={fadeIn}>
            [Image of a person for a video testimonial]
          </motion.div>
          <div className="testimonial-text-v4">
            <motion.p className="testimonial-quote" variants={fadeIn}>
              <FaQuoteLeft />
              WorkTrack made it incredibly easy to find a developer who
              understood our vision. We went from concept to launch in just a
              few weeks.
            </motion.p>
            <motion.h5 variants={fadeIn}>Jane D., CEO at TechStartup</motion.h5>
            <motion.div className="stars-v4" variants={fadeIn}>
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
            </motion.div>
          </div>
        </div>
      </MotionSection>

      {/* === 10. FINAL CTA SECTION === */}
      <MotionSection className="final-cta-v4">
        <div className="container-v4 cta-container-v4">
          <motion.h2 variants={fadeIn}>
            Find the talent you need.
            <br />
            Create the work you want.
          </motion.h2>
          <motion.button
            variants={fadeIn}
            onClick={() => navigate("/authenticate")}
            className="btn-primary-v4"
          >
            Get Started <FaArrowRight />
          </motion.button>
        </div>
      </MotionSection>

      {/* === 11. FOOTER === */}
      <footer className="footer-v4">
        <div className="container-v4 footer-grid-v4">
          {/* ... (Footer columns remain the same as last version) ... */}
          <div className="footer-col-v4">
            <h5>Categories</h5>
            <a>Graphics & Design</a>
            <a>Digital Marketing</a>
            <a>Writing & Translation</a>
            <a>Video & Animation</a>
            <a>Programming & Tech</a>
          </div>
          <div className="footer-col-v4">
            <h5>About</h5>
            <a>Careers</a>
            <a>Press & News</a>
            <a>Privacy Policy</a>
            <a>Terms of Service</a>
          </div>
          <div className="footer-col-v4">
            <h5>Support</h5>
            <a>Help & Support</a>
            <a>Trust & Safety</a>
            <a>Selling on WorkTrack</a>
            <a>Buying on WorkTrack</a>
          </div>
          <div className="footer-col-v4">
            <h5>Community</h5>
            <a>Events</a>
            <a>Blog</a>
            <a>Forum</a>
            <a>Podcast</a>
          </div>
        </div>
        <div className="footer-bottom-v4">
          <div className="container-v4">
            <h3 className="logo-v4">WorkTrack</h3>
            <p>&copy; 2025 WorkTrack Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
