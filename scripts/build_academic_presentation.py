"""
Builds the final academic research presentation for the CHE Makati Discrete-Event Simulation project.
Conforms strictly to 16:9 widescreen format, clean academic research aesthetic,
authentic restaurant photographs, high-resolution empirical charts, and exact presenter tagging.
"""

from pathlib import Path
import json
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor

# Colors
COLOR_BG = RGBColor(0xFA, 0xFA, 0xF9)         # Clean off-white
COLOR_CARD_BG = RGBColor(0xFF, 0xFF, 0xFF)    # Pure white card
COLOR_CARD_BORDER = RGBColor(0xE2, 0xE8, 0xF0)# Subtle border
COLOR_TEXT_MAIN = RGBColor(0x0F, 0x17, 0x2A)  # Deep Charcoal
COLOR_TEXT_MUTED = RGBColor(0x47, 0x55, 0x69) # Slate
COLOR_PRIMARY_RED = RGBColor(0xB2, 0x22, 0x25)# CHE Crimson
COLOR_ACCENT_GOLD = RGBColor(0xD9, 0x77, 0x06)# Warm Amber
COLOR_ACCENT_BLUE = RGBColor(0x02, 0x84, 0xC7)# Courier Blue
COLOR_ACCENT_GREEN = RGBColor(0x05, 0x96, 0x69)# Success Green
COLOR_DARK_HEADER = RGBColor(0x1E, 0x29, 0x3B)# Header Slate

FIG_DIR = Path('presentation/figures')
REF_DIR = Path('references')
OUTPUT_PPTX = Path('presentation/CHE_Makati_Simulation_Final_Presentation.pptx')

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

def set_slide_background(slide, color=COLOR_BG):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_header(slide, category, title, speaker_name, slide_num):
    # Category badge
    cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8.0), Inches(0.3))
    tf = cat_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = category.upper()
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = COLOR_PRIMARY_RED

    # Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.68), Inches(9.2), Inches(0.6))
    tf_t = title_box.text_frame
    tf_t.word_wrap = True
    p_t = tf_t.paragraphs[0]
    p_t.text = title
    p_t.font.size = Pt(20)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_TEXT_MAIN

    # Speaker Badge
    spk_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.0), Inches(0.45), Inches(2.5), Inches(0.42))
    spk_shape.fill.solid()
    spk_shape.fill.fore_color.rgb = RGBColor(0xF1, 0xF5, 0xF9)
    spk_shape.line.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)
    spk_shape.line.width = Pt(1)
    tf_s = spk_shape.text_frame
    tf_s.word_wrap = True
    p_s = tf_s.paragraphs[0]
    p_s.text = f"Presenter: {speaker_name}"
    p_s.alignment = PP_ALIGN.CENTER
    p_s.font.size = Pt(9.5)
    p_s.font.bold = True
    p_s.font.color.rgb = COLOR_TEXT_MAIN

    # Slide Number & Footer Line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.3), Inches(11.733), Inches(0.02))
    line.fill.solid()
    line.fill.fore_color.rgb = RGBColor(0xE2, 0xE8, 0xF0)
    line.line.fill.background()

    footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.3))
    tf_f = footer_box.text_frame
    p_f = tf_f.paragraphs[0]
    p_f.text = f"CSS142P Modeling & Simulation | Carlo's Bacolod Chicken House Express (CHE) Makati | Slide {slide_num}"
    p_f.font.size = Pt(8.5)
    p_f.font.color.rgb = COLOR_TEXT_MUTED

def add_card(slide, left, top, width, height, title=None, bg_color=COLOR_CARD_BG, border_color=COLOR_CARD_BORDER):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(1)
    if title:
        tf = card.text_frame
        tf.vertical_anchor = MSO_ANCHOR.TOP
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_MAIN
        p.space_after = Pt(6)
    return card

# =============================================================================
# SLIDE 1: Title Slide (Person 1 — Bornilla)
# =============================================================================
s1 = prs.slides.add_slide(blank_layout)
set_slide_background(s1, RGBColor(0x0F, 0x17, 0x2A)) # Formal deep navy/charcoal for title

# Main Title Card
t_card = add_card(s1, Inches(1.0), Inches(0.9), Inches(11.333), Inches(5.7), bg_color=RGBColor(0x1E, 0x29, 0x3B), border_color=RGBColor(0x33, 0x41, 0x55))
tf1 = t_card.text_frame
tf1.word_wrap = True
tf1.vertical_anchor = MSO_ANCHOR.TOP

p = tf1.paragraphs[0]
p.text = "ACADEMIC RESEARCH PRESENTATION | CSS142P MODELING & SIMULATION"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = RGBColor(0xF5, 0x9E, 0x0B)
p.space_after = Pt(12)

p2 = tf1.add_paragraph()
p2.text = "Optimizing Multi-Channel Order Fulfillment and Queue Dynamics at Carlo's Bacolod Chicken House Express (CHE) Makati"
p2.font.size = Pt(23)
p2.font.bold = True
p2.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
p2.space_after = Pt(6)

p3 = tf1.add_paragraph()
p3.text = "A Discrete-Event Simulation Approach to Order-Taking, Charcoal Grilling, and Line Bottlenecks"
p3.font.size = Pt(13)
p3.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
p3.space_after = Pt(24)

# Authors row
p4 = tf1.add_paragraph()
p4.text = "Research Investigators:"
p4.font.size = Pt(10.5)
p4.font.bold = True
p4.font.color.rgb = RGBColor(0xEA, 0x58, 0x0C)
p4.space_after = Pt(4)

authors = [
    "• Sean Earl Y. Bornilla (Presenter 1: Problem Formulation, Objectives & Scope)",
    "• Joven Terence O. Cantalejo (Presenter 2: Empirical Data, Input Distributions & SimPy Model)",
    "• Adyson M. Reales (Presenter 3: Baseline Diagnostics, Scenarios, Validation & Policy)",
]
for a in authors:
    pa = tf1.add_paragraph()
    pa.text = a
    pa.font.size = Pt(10)
    pa.font.color.rgb = RGBColor(0xE2, 0xE8, 0xF0)
    pa.space_after = Pt(3)

p5 = tf1.add_paragraph()
p5.text = "\nFaculty of Information & Communications Technology | Academic Year 2025–2026"
p5.font.size = Pt(9.5)
p5.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

# =============================================================================
# SLIDE 2: Restaurant Profile & Operational Context (Person 1 — Bornilla)
# =============================================================================
s2 = prs.slides.add_slide(blank_layout)
set_slide_background(s2)
add_header(s2, "Operational Context", "Establishment Profile & Operational Environment", "Sean Earl Y. Bornilla", 2)

# Left Column: Establishment Details Card
c_left = add_card(s2, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
tf2_l = c_left.text_frame
tf2_l.word_wrap = True

def add_bullet(tf, title, desc):
    p = tf.add_paragraph()
    p.text = f"• {title}: "
    p.font.bold = True
    p.font.size = Pt(10)
    p.font.color.rgb = COLOR_TEXT_MAIN
    run = p.add_run()
    run.text = desc
    run.font.bold = False
    run.font.size = Pt(9.5)
    run.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(8)

p_init = tf2_l.paragraphs[0]
p_init.text = "Carlo's Bacolod Chicken House Express (CHE)"
p_init.font.size = Pt(13)
p_init.font.bold = True
p_init.font.color.rgb = COLOR_PRIMARY_RED
p_init.space_after = Pt(10)

add_bullet(tf2_l, "Location", "Savana Commercial Center, Metropolitan Ave. cor. Chino Roces Ave., Brgy. Sta. Cruz, Makati City.")
add_bullet(tf2_l, "Core Offering", "Authentic Bacolod-style charcoal grilled chicken inasal (pecho, paa, isol, baticolon) paired with garlic rice.")
add_bullet(tf2_l, "High-Density Dining", "12 dining tables (approx. 40 total seating capacity), operating across compact split dining halls.")
add_bullet(tf2_l, "Peak Rush Hours", "Intense stochastic rushes during Lunch (11:30 AM – 1:30 PM) and Dinner (6:00 PM – 8:30 PM).")
add_bullet(tf2_l, "Coupled Workstages", "Order-taking (Cashier POS) is tightly coupled with physical batch grilling and manual assembly/packaging.")

# Right Column: Actual Photos
if (REF_DIR / 'che-entrance-photo.jpg').exists():
    s2.shapes.add_picture(str(REF_DIR / 'che-entrance-photo.jpg'), Inches(6.8), Inches(1.5), Inches(5.7), Inches(2.55))
if (REF_DIR / 'che-interior-photo.jpg').exists():
    s2.shapes.add_picture(str(REF_DIR / 'che-interior-photo.jpg'), Inches(6.8), Inches(4.2), Inches(5.7), Inches(2.6))

# =============================================================================
# SLIDE 3: Problem Formulation: Triple-Channel Bottleneck (Person 1 — Bornilla)
# =============================================================================
s3 = prs.slides.add_slide(blank_layout)
set_slide_background(s3)
add_header(s3, "Problem Formulation", "The Multi-Channel Queueing Dilemma", "Sean Earl Y. Bornilla", 3)

# 3 Channel Cards
channel_data = [
    ("Dine-In Patrons (41.7%)", "Compete for cashier attention to browse menu and order for table parties; must secure 1 of 12 tables after tray assembly.", "#fee2e2", COLOR_PRIMARY_RED),
    ("Walk-In Takeout (30.8%)", "Wait in shared physical line; occupy lobby space during meal preparation; demand packaged bags and condiments.", "#fef3c7", COLOR_ACCENT_GOLD),
    ("Delivery Couriers (27.5%)", "GrabFood / Foodpanda riders on tight delivery SLAs; cluster at entrance with large insulated thermal boxes.", "#e0f2fe", COLOR_ACCENT_BLUE)
]

for idx, (ch_title, ch_desc, bg_col, b_col) in enumerate(channel_data):
    c = add_card(s3, Inches(0.8 + idx * 4.0), Inches(1.5), Inches(3.733), Inches(2.4), bg_color=RGBColor.from_string(bg_col[1:]), border_color=b_col)
    tf = c.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = ch_title
    p.font.size = Pt(11.5)
    p.font.bold = True
    p.font.color.rgb = b_col
    p.space_after = Pt(6)
    p2 = tf.add_paragraph()
    p2.text = ch_desc
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = COLOR_TEXT_MAIN

# Bottom Synthesis Card
c_bottom = add_card(s3, Inches(0.8), Inches(4.1), Inches(11.733), Inches(2.7))
tf3_b = c_bottom.text_frame
tf3_b.word_wrap = True
p_b = tf3_b.paragraphs[0]
p_b.text = "The Core Systemic Bottlenecks Identified:"
p_b.font.size = Pt(12)
p_b.font.bold = True
p_b.font.color.rgb = COLOR_TEXT_MAIN
p_b.space_after = Pt(6)

add_bullet(tf3_b, "Single Shared Cashier Bottleneck", "A single POS register handles all three disparate channels, causing long queue buildup and transaction delays.")
add_bullet(tf3_b, "Physical Corridor Congestion", "A single narrow corridor forces queuing customers, seated diners, and standing courier riders to compete for the same physical space.")
add_bullet(tf3_b, "Severe Customer Balking", "When line length exceeds 8 patrons, incoming customers walk away without ordering, leading to massive lost restaurant revenue.")

# =============================================================================
# SLIDE 4: Research Objectives & Performance Measures (Person 1 — Bornilla)
# =============================================================================
s4 = prs.slides.add_slide(blank_layout)
set_slide_background(s4)
add_header(s4, "Study Goals", "Research Objectives & Key Performance Measures (KPIs)", "Sean Earl Y. Bornilla", 4)

# Left: Objectives
c4_l = add_card(s4, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
tf4_l = c4_l.text_frame
tf4_l.word_wrap = True
p = tf4_l.paragraphs[0]
p.text = "Primary Research Objectives"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_PRIMARY_RED
p.space_after = Pt(10)

add_bullet(tf4_l, "1. Empirical Data Collection", "Collect stopwatch field observations during peak lunch sessions to record inter-arrival times, ordering times, queue lengths, and balking.")
add_bullet(tf4_l, "2. Statistical Distribution Fitting", "Fit parametric probability distributions to operational variables using Kolmogorov-Smirnov goodness-of-fit testing.")
add_bullet(tf4_l, "3. Baseline DES Model Construction", "Develop an event-driven discrete-event simulation in Python (SimPy) replicating CHE's coupled multi-stage production network.")
add_bullet(tf4_l, "4. Scenario Optimization & Validation", "Evaluate decoupled counters, floating order-takers, and dynamic staff reallocation to minimize waiting time and balking.")

# Right: KPI Table
c4_r = add_card(s4, Inches(6.8), Inches(1.5), Inches(5.733), Inches(5.3))
tf4_r = c4_r.text_frame
tf4_r.word_wrap = True
p_r = tf4_r.paragraphs[0]
p_r.text = "Evaluated Key Performance Measures (KPIs)"
p_r.font.size = Pt(13)
p_r.font.bold = True
p_r.font.color.rgb = COLOR_DARK_HEADER
p_r.space_after = Pt(10)

kpi_table = [
    ("$W_q$ (Mean Queue Waiting Time)", "Average duration a customer/rider waits before reaching cashier (Minutes). Target: < 3.0 min."),
    ("$L_q$ / $L_{max}$ (Queue Length)", "Time-weighted average and peak customer count standing in order queue (Pax)."),
    ("$D_{dwell}$ (Courier Dwell Time)", "Total elapsed time from courier arrival until order dispatch handoff (Minutes)."),
    ("$P_{balk}$ (Customer Balking Rate)", "Percentage of arriving customers who walk away due to excessive queue length (%)."),
    ("$\\rho_{cashier}, \\rho_{grill}$ (Utilization)", "Percentage of operational time cashier, grill master, and assembly staff are actively engaged (%)."),
    ("Throughput ($TH$)", "Completed order fulfillments per operational hour across all 3 channels.")
]
for kpi, desc in kpi_table:
    add_bullet(tf4_r, kpi, desc)

# =============================================================================
# SLIDE 5: Scope, Boundary Conditions & Assumptions (Person 1 — Bornilla)
# =============================================================================
s5 = prs.slides.add_slide(blank_layout)
set_slide_background(s5)
add_header(s5, "Methodological Boundaries", "Study Scope, Delimitations & Modeling Assumptions", "Sean Earl Y. Bornilla", 5)

c5_l = add_card(s5, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
tf5_l = c5_l.text_frame
tf5_l.word_wrap = True
p = tf5_l.paragraphs[0]
p.text = "In-Scope Operational Elements"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_PRIMARY_RED
p.space_after = Pt(10)

add_bullet(tf5_l, "Temporal Window", "2-hour peak lunch rush (11:30 AM – 1:30 PM, 120 minutes) with 15-minute warmup initialization.")
add_bullet(tf5_l, "Three Distinct Channels", "Dine-in patrons, walk-in takeout customers, and third-party delivery riders (GrabFood, Foodpanda).")
add_bullet(tf5_l, "Coupled Production Stages", "Stage 1: POS Counter $\\rightarrow$ Stage 2A: Charcoal Grill $\\rightarrow$ Stage 2B: Assembly $\\rightarrow$ Stage 3: Seating / Sidewalk.")
add_bullet(tf5_l, "Balking Mechanism", "Queue-dependent balking probability triggered when line length exceeds threshold ($L_q > 8$ pax).")

c5_r = add_card(s5, Inches(6.8), Inches(1.5), Inches(5.733), Inches(5.3))
tf5_r = c5_r.text_frame
tf5_r.word_wrap = True
p = tf5_r.paragraphs[0]
p.text = "Explicit Delimitations & Assumptions"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_DARK_HEADER
p.space_after = Pt(10)

add_bullet(tf5_r, "Non-Intrusive Public Observation", "Timings gathered via stopwatch and visual tallies from public dining area; no interference with kitchen staff.")
add_bullet(tf5_r, "Grill Physics Abstraction", "Charcoal batch cooking is modeled via calibrated stochastic service delays (8.5–9.5 min / 14 pcs), not thermodynamic heat transfer.")
add_bullet(tf5_r, "Bounded Dining Delays", "Table occupancy is modeled as a stochastic duration distribution (mean ~14.0 min); pathfinding inside dining rooms is bounded.")
add_bullet(tf5_r, "Excluded Factors", "Financial balance sheets, supply chain raw ingredient purchasing, and menu price elasticities are outside simulation scope.")

# =============================================================================
# SLIDE 6: Field Data Collection Methodology (Person 2 — Cantalejo)
# =============================================================================
s6 = prs.slides.add_slide(blank_layout)
set_slide_background(s6)
add_header(s6, "Empirical Grounding", "Field Data Collection Protocol & Observation Bins", "Joven Terence O. Cantalejo", 6)

c6_l = add_card(s6, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
tf6_l = c6_l.text_frame
tf6_l.word_wrap = True
p = tf6_l.paragraphs[0]
p.text = "Data Collection Protocol at Savana Market"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_PRIMARY_RED
p.space_after = Pt(10)

add_bullet(tf6_l, "Site Observation Schedule", "On-site stopwatch measurements conducted during peak lunch periods at Savana Commercial Center, Makati.")
add_bullet(tf6_l, "15-Minute Binned Tracking", "Arrival intensity, queue length, and transaction milestones logged in 15-minute intervals to capture surge non-homogeneity.")
add_bullet(tf6_l, "Channel Tagging", "Each arrival explicitly classified: Dine-In, Walk-In Takeout, or Delivery Courier (noting courier brand: GrabFood vs Foodpanda).")
add_bullet(tf6_l, "Timestamp Milestones Logged", "$t_{arrival}, t_{queue\\_enter}, t_{order\\_start}, t_{order\\_end}, t_{assembly\\_end}, t_{seated}, t_{exit}$.")

c6_r = add_card(s6, Inches(6.8), Inches(1.5), Inches(5.733), Inches(5.3))
tf6_r = c6_r.text_frame
tf6_r.word_wrap = True
p = tf6_r.paragraphs[0]
p.text = "Empirical Sample Summary (N = 120)"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_DARK_HEADER
p.space_after = Pt(10)

add_bullet(tf6_r, "Total Observed Arrivals", "120 distinct customer arrivals recorded across the 120-minute peak observation period (11:30 AM – 1:30 PM).")
add_bullet(tf6_r, "Actual Customers Served", "35 customers successfully completed payment, assembly, and fulfillment at the single shared counter.")
add_bullet(tf6_r, "Empirical Balking Instances", "85 arriving patrons (70.8%) walked away upon observing extreme queue buildup (15–22 people in line).")
add_bullet(tf6_r, "Items per Transaction", "Dine-In: 1–4 pcs (mean 2.1), Takeout: 1–4 pcs (mean 2.3), Couriers: 1–5 pcs (mean 2.8).")

# =============================================================================
# SLIDE 7: Dataset Characteristics & Arrival Surge (Person 2 — Cantalejo)
# =============================================================================
s7 = prs.slides.add_slide(blank_layout)
set_slide_background(s7)
add_header(s7, "Empirical Data", "Arrival Surge Intensity & Customer Channel Breakdown", "Joven Terence O. Cantalejo", 7)

# Image: Figure 1
if (FIG_DIR / 'fig1_arrival_frequency_and_channels.png').exists():
    s7.shapes.add_picture(str(FIG_DIR / 'fig1_arrival_frequency_and_channels.png'), Inches(0.8), Inches(1.5), Inches(11.733), Inches(4.3))

# Key Insights Callout Card below
c7_b = add_card(s7, Inches(0.8), Inches(5.9), Inches(11.733), Inches(1.0), bg_color=RGBColor(0xF8, 0xFA, 0xFC))
tf7_b = c7_b.text_frame
tf7_b.word_wrap = True
p = tf7_b.paragraphs[0]
p.text = "Key Empirical Findings: "
p.font.bold = True
p.font.size = Pt(10)
p.font.color.rgb = COLOR_PRIMARY_RED
run = p.add_run()
run.text = "Arrivals follow a distinct non-homogeneous bell surge peaking between 12:15 PM – 12:45 PM (up to 26 arrivals/15-min). The channel mix consists of 41.7% Dine-In, 30.8% Takeout, and 27.5% Couriers, generating simultaneous competing service demands at the single register."
run.font.size = Pt(9.5)
run.font.color.rgb = COLOR_TEXT_MAIN

# =============================================================================
# SLIDE 8: Statistical Input Modeling & Goodness-of-Fit (Person 2 — Cantalejo)
# =============================================================================
s8 = prs.slides.add_slide(blank_layout)
set_slide_background(s8)
add_header(s8, "Stochastic Input Calibration", "Statistical Distribution Fitting & Goodness-of-Fit (K-S Tests)", "Joven Terence O. Cantalejo", 8)

if (FIG_DIR / 'fig2_input_distribution_fits.png').exists():
    s8.shapes.add_picture(str(FIG_DIR / 'fig2_input_distribution_fits.png'), Inches(0.8), Inches(1.5), Inches(11.733), Inches(4.3))

c8_b = add_card(s8, Inches(0.8), Inches(5.9), Inches(11.733), Inches(1.0), bg_color=RGBColor(0xF8, 0xFA, 0xFC))
tf8_b = c8_b.text_frame
tf8_b.word_wrap = True
p = tf8_b.paragraphs[0]
p.text = "Distribution Goodness-of-Fit Summary: "
p.font.bold = True
p.font.size = Pt(10)
p.font.color.rgb = COLOR_PRIMARY_RED
run = p.add_run()
run.text = "Interarrivals fitted to Gamma(alpha=0.78, beta=1.03, KS p=0.86). Cashier ordering times modeled via Triangular distributions: Dine-In (min 0.8, mode 1.6, max 3.2m), Takeout (min 0.6, mode 1.2, max 2.4m), and Couriers (min 0.35, mode 0.7, max 1.3m). All fitted models satisfy p > 0.05 Kolmogorov-Smirnov thresholds."
run.font.size = Pt(9.5)
run.font.color.rgb = COLOR_TEXT_MAIN

# =============================================================================
# SLIDE 9: Discrete-Event Simulation Architecture (Person 2 — Cantalejo)
# =============================================================================
s9 = prs.slides.add_slide(blank_layout)
set_slide_background(s9)
add_header(s9, "Simulation Modeling", "Multi-Stage Discrete-Event Simulation Architecture (SimPy)", "Joven Terence O. Cantalejo", 9)

if (FIG_DIR / 'fig3_des_queue_network_diagram.png').exists():
    s9.shapes.add_picture(str(FIG_DIR / 'fig3_des_queue_network_diagram.png'), Inches(0.8), Inches(1.5), Inches(11.733), Inches(4.2))

c9_b = add_card(s9, Inches(0.8), Inches(5.8), Inches(11.733), Inches(1.1), bg_color=RGBColor(0xF8, 0xFA, 0xFC))
tf9_b = c9_b.text_frame
tf9_b.word_wrap = True
p = tf9_b.paragraphs[0]
p.text = "SimPy Operational Architecture: "
p.font.bold = True
p.font.size = Pt(10)
p.font.color.rgb = COLOR_PRIMARY_RED
run = p.add_run()
run.text = "Implemented as a multi-stage coupled queue network in SimPy. Uses Resource(capacity=1) for Cashier POS, Container(capacity=100) for cooked chicken buffer, Resource(capacity=1) for Assembly packaging, and Resource(capacity=12) for dining tables. Features state-dependent balking logic and continuous time-weighted Lq accumulators."
run.font.size = Pt(9.5)
run.font.color.rgb = COLOR_TEXT_MAIN

# =============================================================================
# SLIDE 10: Restaurant Layout & Digital Twin Verification (Person 2 — Cantalejo)
# =============================================================================
s10 = prs.slides.add_slide(blank_layout)
set_slide_background(s10)
add_header(s10, "Spatial Modeling", "Restaurant Floor Plan & 3D Digital Twin Verification", "Joven Terence O. Cantalejo", 10)

c10_l = add_card(s10, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
tf10_l = c10_l.text_frame
tf10_l.word_wrap = True
p = tf10_l.paragraphs[0]
p.text = "Savana Market Layout Architecture"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_PRIMARY_RED
p.space_after = Pt(10)

add_bullet(tf10_l, "Left Dining Room", "6 square 2-seat dining tables arranged in 2x3 grid; accessed via private doorway west of main corridor.")
add_bullet(tf10_l, "Central Service Counter", "Cashier POS counter, pass-through pickup window, and adjacent waiting chairs along main thoroughfare.")
add_bullet(tf10_l, "Central Kitchen Core", "Charcoal grilling battery with exhaust hood in rear; assembly prep table and packaging line in front.")
add_bullet(tf10_l, "Right Dining Hall", "6 large dining tables (mix of 4-seat wood rectangular tables & square tables) for larger dine-in groups.")
add_bullet(tf10_l, "Savana Arcade Facade", "Direct glass-fronted entrance along Savana Market covered sidewalk arcade.")

c10_r = add_card(s10, Inches(6.8), Inches(1.5), Inches(5.733), Inches(5.3))
tf10_r = c10_r.text_frame
tf10_r.word_wrap = True
p = tf10_r.paragraphs[0]
p.text = "Digital Twin Verification & Waypoint Routing"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_DARK_HEADER
p.space_after = Pt(10)

add_bullet(tf10_r, "Interactive 3D Digital Twin", "Built with Three.js WebGL to visually mirror CHE's exact physical spatial coordinates, yellow walls, and tile flooring.")
add_bullet(tf10_r, "Exact Chair Seating Logic", "Patrons receive table IDs, navigate around interior walls, occupy individual chairs, dine, and vacate tables on meal finish.")
add_bullet(tf10_r, "Synchronized Queue Step-Up", "Queue slots update in real time with 1.0m human spacing without unnatural gaps.")
add_bullet(tf10_r, "Live Telemetry HUD", "Displays real-time Wq, Lq, balking count, courier dwell times, and grill inventory synchronized with SimPy model.")

# =============================================================================
# SLIDE 11: Baseline Operational Diagnostics (Person 3 — Reales)
# =============================================================================
s11 = prs.slides.add_slide(blank_layout)
set_slide_background(s11)
add_header(s11, "Experimental Findings", "Baseline System Diagnostics: The Operational Reality", "Adyson M. Reales", 11)

c11_l = add_card(s11, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
tf11_l = c11_l.text_frame
tf11_l.word_wrap = True
p = tf11_l.paragraphs[0]
p.text = "Baseline Diagnostic Metrics (30 Replications)"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_PRIMARY_RED
p.space_after = Pt(10)

baseline_stats = [
    ("Mean Queue Wait Time ($W_q$)", "13.02 minutes (95% CI: [11.80, 14.24])"),
    ("Peak Queue Length ($L_{max}$)", "22.10 customers in line (95% CI: [20.80, 23.40])"),
    ("Customer Balking Rate ($P_{balk}$)", "47.27% of arrivals balk (80.7 customers lost per rush)"),
    ("Courier Mean Dwell Time", "68.58 minutes from arrival to order pickup"),
    ("Cashier Resource Utilization", "97.72% (Near total operational saturation)"),
    ("Order Throughput", "7.52 completed orders per operational hour"),
]
for metric, val in baseline_stats:
    add_bullet(tf11_l, metric, val)

c11_r = add_card(s11, Inches(6.8), Inches(1.5), Inches(5.733), Inches(5.3))
tf11_r = c11_r.text_frame
tf11_r.word_wrap = True
p = tf11_r.paragraphs[0]
p.text = "Key Bottleneck Insights"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_DARK_HEADER
p.space_after = Pt(10)

add_bullet(tf11_r, "Severe Upstream Starvation", "The single cashier acts as a massive operational choke point, starving the kitchen assembly line while customers queue outside.")
add_bullet(tf11_r, "Catastrophic Customer Loss", "Nearly half of all potential patrons balk due to line visibility; 80+ customers walk away every single lunch rush.")
add_bullet(tf11_r, "Delivery SLA Breaches", "Couriers experience average dwell times of 68+ minutes, severely degrading delivery app ratings and customer satisfaction.")
add_bullet(tf11_r, "Unused Table Capacity", "Despite full dining rooms, table turnover is constrained by order-taking delays rather than physical seating limits.")

# =============================================================================
# SLIDE 12: Evaluated Improvement Scenarios (Person 3 — Reales)
# =============================================================================
s12 = prs.slides.add_slide(blank_layout)
set_slide_background(s12)
add_header(s12, "Optimization Proposals", "Evaluated Operational Scenarios (A, B, C & Combined)", "Adyson M. Reales", 12)

scen_cards = [
    ("Scenario A: Channel Decoupling", "Deploys a dedicated Express POS 2 for Takeout & Couriers while keeping POS 1 for Dine-In.", "Cuts courier interference with dine-in line.", COLOR_PRIMARY_RED, "#fee2e2"),
    ("Scenario B: Floating Expediter", "A roving staff member with paper/mobile slips pre-takes orders when queue length reaches >= 4.", "Reduces register transaction duration by 55%.", COLOR_ACCENT_GOLD, "#fef3c7"),
    ("Scenario C: Dynamic Peak Staffing", "Reallocates 1 kitchen prep worker to front-line assembly and bagging during rush (mins 30–90).", "Accelerates chicken packaging by 35%.", RGBColor(0x7C, 0x3A, 0xED), "#f3e8ff"),
    ("Combined Policy (Exploratory)", "Synchronous deployment of Decoupled POS 2 + Floating Expediter + Dynamic Peak Assembly Support.", "Synergistic optimization across all stages.", COLOR_ACCENT_GREEN, "#dcfce7"),
]

for idx, (title, mech, impact, b_col, bg_col) in enumerate(scen_cards):
    row = idx // 2
    col = idx % 2
    c = add_card(s12, Inches(0.8 + col * 6.0), Inches(1.5 + row * 2.7), Inches(5.7), Inches(2.5), bg_color=RGBColor.from_string(bg_col[1:]), border_color=b_col)
    tf = c.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(11.5)
    p.font.bold = True
    p.font.color.rgb = b_col
    p.space_after = Pt(4)
    p2 = tf.add_paragraph()
    p2.text = f"Mechanism: {mech}"
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = COLOR_TEXT_MAIN
    p2.space_after = Pt(3)
    p3 = tf.add_paragraph()
    p3.text = f"Expected Impact: {impact}"
    p3.font.size = Pt(9.5)
    p3.font.bold = True
    p3.font.color.rgb = COLOR_DARK_HEADER

# =============================================================================
# SLIDE 13: Comparative Simulation Results & Graphs (Person 3 — Reales)
# =============================================================================
s13 = prs.slides.add_slide(blank_layout)
set_slide_background(s13)
add_header(s13, "Experimental Findings", "Comparative Simulation Results: Waiting Time & Balking", "Adyson M. Reales", 13)

if (FIG_DIR / 'fig6_scenario_waiting_and_queue_comparison.png').exists():
    s13.shapes.add_picture(str(FIG_DIR / 'fig6_scenario_waiting_and_queue_comparison.png'), Inches(0.8), Inches(1.5), Inches(11.733), Inches(4.3))

c13_b = add_card(s13, Inches(0.8), Inches(5.9), Inches(11.733), Inches(1.0), bg_color=RGBColor(0xF8, 0xFA, 0xFC))
tf13_b = c13_b.text_frame
tf13_b.word_wrap = True
p = tf13_b.paragraphs[0]
p.text = "Quantitative Results Summary (30 Replications): "
p.font.bold = True
p.font.size = Pt(10)
p.font.color.rgb = COLOR_PRIMARY_RED
run = p.add_run()
run.text = "Channel Decoupling (Scenario A) reduces mean queue waiting time by 87.7% (13.02m -> 1.60m). The Floating Expediter (Scenario B) achieves a 61.2% wait reduction (5.05m). The Combined Policy achieves a 88.6% wait reduction (1.48m) and suppresses customer balking from 47.3% down to 3.73%."
run.font.size = Pt(9.5)
run.font.color.rgb = COLOR_TEXT_MAIN

# =============================================================================
# SLIDE 14: Trade-Off Analysis & Staffing Economics (Person 3 — Reales)
# =============================================================================
s14 = prs.slides.add_slide(blank_layout)
set_slide_background(s14)
add_header(s14, "Decision Analysis", "Operational Trade-Offs, Courier Dwell & Staffing Economics", "Adyson M. Reales", 14)

# Left: Scatter Chart (Figure 7)
if (FIG_DIR / 'fig7_throughput_and_balking_tradeoffs.png').exists():
    s14.shapes.add_picture(str(FIG_DIR / 'fig7_throughput_and_balking_tradeoffs.png'), Inches(0.8), Inches(1.5), Inches(6.2), Inches(4.3))

# Right: Trade-off Comparison Table Card
c14_r = add_card(s14, Inches(7.2), Inches(1.5), Inches(5.333), Inches(5.3))
tf14_r = c14_r.text_frame
tf14_r.word_wrap = True
p = tf14_r.paragraphs[0]
p.text = "Implementation Trade-Off Analysis"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = COLOR_PRIMARY_RED
p.space_after = Pt(8)

add_bullet(tf14_r, "Scenario A (Decoupling)", "Highest wait time reduction; requires physical hardware (2nd POS register terminal + counter space).")
add_bullet(tf14_r, "Scenario B (Expediter)", "Zero capital expense; uses existing roving personnel with order slips; cuts balking by 62.4%.")
add_bullet(tf14_r, "Scenario C (Dynamic Staff)", "Best for courier dwell time reduction (56.09 min); does not solve cashier bottleneck on its own.")
add_bullet(tf14_r, "Combined Policy", "Optimal operational efficiency: 12.35 orders/hr throughput, 3.7% balking, and 51.71m dwell time.")

# =============================================================================
# SLIDE 15: Sensitivity Analysis & Robustness Verification (Person 3 — Reales)
# =============================================================================
s15 = prs.slides.add_slide(blank_layout)
set_slide_background(s15)
add_header(s15, "Stress Testing", "Sensitivity Analysis across Arrival Volume Surges (±20%)", "Adyson M. Reales", 15)

if (FIG_DIR / 'fig8_sensitivity_analysis_arrival_surge.png').exists():
    s15.shapes.add_picture(str(FIG_DIR / 'fig8_sensitivity_analysis_arrival_surge.png'), Inches(0.8), Inches(1.5), Inches(11.733), Inches(4.3))

c15_b = add_card(s15, Inches(0.8), Inches(5.9), Inches(11.733), Inches(1.0), bg_color=RGBColor(0xF8, 0xFA, 0xFC))
tf15_b = c15_b.text_frame
tf15_b.word_wrap = True
p = tf15_b.paragraphs[0]
p.text = "Sensitivity & Robustness Findings: "
p.font.bold = True
p.font.size = Pt(10)
p.font.color.rgb = COLOR_PRIMARY_RED
run = p.add_run()
run.text = "Under a +20% customer surge, Baseline wait times explode to 18.9 minutes with 61.8% balking. In contrast, Scenario A (Decoupling) and Combined Policy maintain stable wait times under 3.4 minutes and balking below 8%, demonstrating superior system resilience under stochastic demand spikes."
run.font.size = Pt(9.5)
run.font.color.rgb = COLOR_TEXT_MAIN

# =============================================================================
# SLIDE 16: Model Validation, Replications & Limitations (Person 3 — Reales)
# =============================================================================
s16 = prs.slides.add_slide(blank_layout)
set_slide_background(s16)
add_header(s16, "Validation & Rigor", "Model Validation, Statistical Confidence & Research Limitations", "Adyson M. Reales", 16)

if (FIG_DIR / 'fig9_validation_observed_vs_simulated.png').exists():
    s16.shapes.add_picture(str(FIG_DIR / 'fig9_validation_observed_vs_simulated.png'), Inches(0.8), Inches(1.5), Inches(11.733), Inches(4.3))

c16_b = add_card(s16, Inches(0.8), Inches(5.9), Inches(11.733), Inches(1.0), bg_color=RGBColor(0xF8, 0xFA, 0xFC))
tf16_b = c16_b.text_frame
tf16_b.word_wrap = True
p = tf16_b.paragraphs[0]
p.text = "Validation & Methodological Rigor: "
p.font.bold = True
p.font.size = Pt(10)
p.font.color.rgb = COLOR_PRIMARY_RED
run = p.add_run()
run.text = "Simulated queue parameters match observed field metrics within 95% confidence intervals (Observed Lq = 14.2 vs Simulated Lq = 13.77; Peak Lq = 22.0 vs Simulated Lmax = 22.1). Conducted across 30 independent Monte Carlo replications with common random numbers (CRN) for variance reduction."
run.font.size = Pt(9.5)
run.font.color.rgb = COLOR_TEXT_MAIN

# =============================================================================
# SLIDE 17: Conclusions, Recommendations & Q&A (All Presenters)
# =============================================================================
s17 = prs.slides.add_slide(blank_layout)
set_slide_background(s17)
add_header(s17, "Conclusions & Recommendations", "Conclusions, Phased Implementation Roadmap & Q&A", "All Presenters", 17)

c17_l = add_card(s17, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
tf17_l = c17_l.text_frame
tf17_l.word_wrap = True
p = tf17_l.paragraphs[0]
p.text = "Core Research Conclusions"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_PRIMARY_RED
p.space_after = Pt(10)

add_bullet(tf17_l, "Order-Taking is the Primary Bottleneck", "CHE's operational crisis is driven by cashier register saturation (97.7%), not seating or kitchen capacity.")
add_bullet(tf17_l, "Channel Decoupling is Highest-ROI", "Separating walk-in/dine-in from couriers via a secondary Express counter eliminates 88% of line delays.")
add_bullet(tf17_l, "Floating Expediter as Immediate Fix", "Deploying a roving order-taker requires zero hardware and recovers 60%+ of lost sales immediately.")
add_bullet(tf17_l, "Combined Policy Delivers Optimum", "Synergistic deployment cuts balking from 47.3% to 3.7% and elevates throughput to 12.35 orders/hr.")

c17_r = add_card(s17, Inches(6.8), Inches(1.5), Inches(5.733), Inches(5.3))
tf17_r = c17_r.text_frame
tf17_r.word_wrap = True
p = tf17_r.paragraphs[0]
p.text = "Managerial Implementation Roadmap"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_DARK_HEADER
p.space_after = Pt(10)

add_bullet(tf17_r, "Phase 1: Immediate Zero-Cost Action", "Implement Scenario B (Floating Expediter) during peak hours (12:00–1:00 PM / 7:00–8:00 PM) using order slips.")
add_bullet(tf17_r, "Phase 2: Dynamic Kitchen Allocation", "Reallocate prep staff to tray assembly (Scenario C) during active rush windows to prevent order staging delays.")
add_bullet(tf17_r, "Phase 3: Hardware Decoupling", "Install a dedicated Express POS 2 terminal (Scenario A) for courier dispatch and takeout orders.")
add_bullet(tf17_r, "Thank You / Open for Panel Questions", "Sean Earl Y. Bornilla | Joven Terence O. Cantalejo | Adyson M. Reales")

# Save presentation
prs.save(str(OUTPUT_PPTX))
print(f"SUCCESS: Generated 17-slide PowerPoint presentation at {OUTPUT_PPTX}")
