import sys
import json
# Import the trulens-eval library; ensure it's installed in your Python environment.
from trulens_eval import Eval

def main():
    if len(sys.argv) < 2:
        print("Error: No text provided for evaluation.")
        sys.exit(1)

    # Retrieve the text passed as a command-line argument
    text_to_evaluate = sys.argv[1]

    # Initialize the Eval object
    eval_obj = Eval()

    # Perform the evaluation
    eval_results = eval_obj.run(text_to_evaluate)

    # Convert the evaluation results to JSON and print them
    print(json.dumps(eval_results))

if __name__ == "__main__":
    main()
