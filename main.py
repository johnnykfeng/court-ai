from PROMPTS import DUMMY_TEXT

def main(user_input, pdf_texts, relevant_data):
    
    
    # responsellm.invoke(user_input, pdf_texts, relevant_data)
    print(user_input)
    return str(user_input)
    
## display the response in the frontend
if __name__ == "__main__":
    print(main(DUMMY_TEXT, DUMMY_TEXT, DUMMY_TEXT))
    
    

