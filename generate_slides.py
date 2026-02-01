from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor

def create_presentation():
    prs = Presentation()

    # Define some brand colors
    # MindChess Blue-ish (implied from typical tech accessible themes)
    # Let's use a nice professional dark blue for titles
    TITLE_COLOR = RGBColor(0, 51, 102) 

    def add_slide(layout_index, title_text, content_text=None):
        slide_layout = prs.slide_layouts[layout_index]
        slide = prs.slides.add_slide(slide_layout)
        
        title = slide.shapes.title
        title.text = title_text
        title.text_frame.paragraphs[0].font.color.rgb = TITLE_COLOR
        title.text_frame.paragraphs[0].font.bold = True

        if content_text:
            # Layout 1 usually has a body placeholder
            if len(slide.placeholders) > 1:
                body = slide.placeholders[1]
                tf = body.text_frame
                tf.text = content_text

        return slide

    # --- Slide 1: Title Slide ---
    slide = prs.slides.add_slide(prs.slide_layouts[0]) # Title Slide
    title = slide.shapes.title
    subtitle = slide.placeholders[1]

    title.text = "MindChess"
    title.text_frame.paragraphs[0].font.color.rgb = TITLE_COLOR
    title.text_frame.paragraphs[0].font.bold = True
    
    subtitle.text = "Voice-Controlled Chess for the Visually Impaired\n\nIván Sebastián Loor Weir\nJan 3, 2026"

    # --- Slide 2: The Problem ---
    # Bullet points layout
    s2 = add_slide(1, "The Challenge")
    tf = s2.placeholders[1].text_frame
    tf.text = "Chess is a universal game, but digital platforms create barriers:"
    
    p = tf.add_paragraph()
    p.text = "Heavy reliance on visual board interaction (drag & drop)."
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Screen readers often provide incomplete or confusing context."
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Lack of native voice control in mainstream apps."
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Result: Blind players are excluded from independent digital play."
    p.level = 0
    p.space_before = Pt(20)

    # --- Slide 3: The Solution ---
    s3 = add_slide(1, "Introducing MindChess")
    tf = s3.placeholders[1].text_frame
    tf.text = "A web-based, accessibility-first chess application."
    
    p = tf.add_paragraph()
    p.text = "100% Voice Controlled: No mouse or keyboard needed."
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Real-time Audio Feedback: The game speaks to you."
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Zero Install: Runs in any modern browser."
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Mission: Making chess accessible to everyone, one move at a time."
    p.level = 0
    p.space_before = Pt(20)
    p.font.bold = True

    # --- Slide 4: Key Features ---
    s4 = add_slide(1, "Key Features")
    tf = s4.placeholders[1].text_frame
    
    p = tf.add_paragraph()
    p.text = "🎤 Natural Voice Commands"
    p.level = 0
    p2 = tf.add_paragraph()
    p2.text = "\"Move pawn to e4\", \"Knight takes f6\", \"Castle kingside\""
    p2.level = 1

    p = tf.add_paragraph()
    p.text = "🤖 AI Opponent"
    p.level = 0
    p2 = tf.add_paragraph()
    p2.text = "Built-in Minimax engine with Alpha-Beta pruning for offline play."
    p2.level = 1

    p = tf.add_paragraph()
    p.text = "🔊 Full Game State Audio"
    p.level = 0
    p2 = tf.add_paragraph()
    p2.text = "Announcements for Check, Checkmate, and illegal moves."
    p2.level = 1
    
    p = tf.add_paragraph()
    p.text = "🔄 Game Controls"
    p.level = 0
    p2 = tf.add_paragraph()
    p2.text = "Undo, Read History, Repeat Last Move."
    p2.level = 1

    # --- Slide 5: Technical Architecture ---
    s5 = add_slide(1, "Under the Hood")
    tf = s5.placeholders[1].text_frame
    
    p = tf.add_paragraph()
    p.text = "Frontend Stack"
    p.font.bold = True
    
    p = tf.add_paragraph()
    p.text = "Web Speech API (SpeechRecognition & SpeechSynthesis)"
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Chess.js (Logic & Validation)"
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Chessground (Visual UI for sighted helpers)"
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "AI Logic"
    p.font.bold = True
    p.space_before = Pt(18)
    
    p = tf.add_paragraph()
    p.text = "Client-side Minimax Algorithm"
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Piece-Square Tables for position evaluation"
    p.level = 1

    # --- Slide 6: Demo / User Flow ---
    s6 = add_slide(1, "User Experience")
    tf = s6.placeholders[1].text_frame
    tf.text = "Simple, Cyclic Interaction Loop:"
    
    p = tf.add_paragraph()
    p.text = "1. ACTIVATE: User presses 'V' or clicks 'Speak'."
    p.level = 0
    p.space_before = Pt(12)
    
    p = tf.add_paragraph()
    p.text = "2. COMMAND: \"Knight to c3\""
    p.level = 0
    
    p = tf.add_paragraph()
    p.text = "3. FEEDBACK: \"Player 1 made the move c3\""
    p.level = 0
    
    p = tf.add_paragraph()
    p.text = "4. RESPONSE: AI moves immediately or opponent plays."
    p.level = 0
    
    p = tf.add_paragraph()
    p.text = "Visuals serve as a fallback/guide for sighted peers, but the audio loop is complete."
    p.level = 0
    p.space_before = Pt(20)
    p.font.italic = True

    # --- Slide 7: Impact & Future ---
    s7 = add_slide(1, "Impact & Future Roadmap")
    tf = s7.placeholders[1].text_frame
    
    p = tf.add_paragraph()
    p.text = "Current Impact"
    p.font.bold = True
    
    p = tf.add_paragraph()
    p.text = "Demonstrates that complex games can be fully accessible via web standards."
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Roadmap"
    p.font.bold = True
    p.space_before = Pt(18)
    
    p = tf.add_paragraph()
    p.text = "Multi-language support (Spanish, French, etc.)"
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Multiplayer Online Mode (via WebSockets)"
    p.level = 1
    
    p = tf.add_paragraph()
    p.text = "Stronger AI (Stockfish integration)"
    p.level = 1

    # --- Slide 8: Conclusion ---
    s8 = add_slide(0, "Thank You") # Title slide layout again for ending
    title = s8.shapes.title
    title.text = "MindChess"
    
    sub = s8.placeholders[1]
    sub.text = "Open Source & Available Now\n\nhttps://github.com/sebas80sebas/MindChess"

    # Save
    prs.save('MindChess_Presentation.pptx')
    print("Successfully generated MindChess_Presentation.pptx")

if __name__ == "__main__":
    create_presentation()
