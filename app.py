import streamlit as st
import google.generativeai as genai

st.set_page_config(page_title="c47 Umar Hacker AI", page_icon="💀")
st.title("💀 c47 Umar Hacker AI - Sukkur ke Shahzade ki AI")

api_key = st.text_input("Gemini API Key daalo:", type="password")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    if "chat" not in st.session_state:
        st.session_state.chat = model.start_chat()
    
    user_input = st.text_input("Kya poochna hai Shahzada?")
    
    if user_input:
        with st.spinner("Soch raha hun..."):
            response = st.session_state.chat.send_message(user_input)
        st.write("**AI:** " + response.text)
else:
    st.warning("AQ.Ab8RN6J9i60ULx4VQhoTsig4PlxQe0NwbM0-KwPZFpC3KQKSxQ")
