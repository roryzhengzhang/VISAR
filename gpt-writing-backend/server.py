import re
import os
import json
import openai
from flask import Flask, redirect, render_template, request, url_for, make_response, jsonify
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
openai.api_key = "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"
model_type = "text-davinci-003"
tempature = 0.6
max_tokens = 2048


@app.route("/", methods=["GET", "POST"])
def gpt_inference():
    if request.method == "GET":
        prompt = request.args.get("prompt")
        print(f"prompt: {prompt}")
        response = openai.Completion.create(
            model=model_type,
            prompt=prompt,
            temperature=tempature,
            max_tokens=max_tokens
        )
        print(f"response: {response.choices[0].text}")
        res = {
            "response": response.choices[0].text
        }
        return jsonify(res)


@app.route("/keyword", methods=["GET"])
def gpt_fetch_keywords():

    # test mode

    return jsonify({"response": ["Quality of life", "Economy", "Population", "Education", "Location", "Safety", "Job opportunity"]})

    if request.method == "GET":
        prompt = request.args.get("prompt")
        mode = request.args.get("mode")

        example = '''
Aspects for for elaborating: "Houston is a good city": 
1. Quality of life
2. Economy
3. Population
4. Education
5. Location
6. Safety
7. Job opportunity

Aspects for elaborating: "Computer Science is a good major":
1. Social demand
2. Job opportunity
3. Promise
4. Salary
5. Enrollment
6. Popularity
7. Job security
        '''

        print(f"prompt: {prompt}")

        if mode == "elaborate":
            prompt = example + "\n\n" + "Aspects for elaborating: " + prompt

        response = openai.Completion.create(
            model=model_type,
            prompt=prompt,
            temperature=tempature,
            max_tokens=max_tokens
        )

        res = response.choices[0].text.strip()

        print(f"response: {response.choices[0].text}")
        keywords = []
        # get the keyword part of the response
        res = res.strip().splitlines()
        for index, r in enumerate(res):
            if len(r) == 0:
                continue
            if index == 0 and not r[0].isdigit():
                continue
            pattern = r"^\d{1,2}. ?(.*)|^- ?(.*)|(.*)"
            # only consider the first match, findall returns the matched part for each group in the first match
            keyword = re.findall(pattern, r)[0]
            keyword = [ k for k in keyword if len(k) > 0][0]

            if keyword is None:
                continue

            if any(x in [":", "-"] for x in keyword):
                keyword = keyword.split(":")[0]
            keywords.append(keyword)
        
        print(f"returned keywords: {keywords}")

        res = {
            "response": keywords
        }
        return jsonify(res)


@app.route("/prompts", methods=["POST"])
def gpt_fetch_prompts():
    if request.method == "POST":
        response = request.get_json()
        keywords = response["keywords"]
        context = response["context"]

        prompts = []

        # test mode

        res = []
        for key in keywords:
            res.append({"keyword": key, "prompt": "What is the relationship between " + key + " and " + context + "?"})
        return jsonify({"response": res})

        # dev mode
        for key in keywords:

            gpt_prompt = f"What questions you can think of about the perspective of {key} given the following context: {context}"

            response = openai.Completion.create(
                model=model_type,
                prompt=gpt_prompt,
                temperature=tempature,
                max_tokens=max_tokens
            )
            print(f"response: {response.choices[0].text}")

            res = response.choices[0].text.strip().splitlines()
            for index, r in enumerate(res):
                if len(r) == 0:
                    continue
                if index == 0 and ( not r[0].isdigit() or r[0] != "-"):
                    continue
                # print(f"Line: {r}")
                pattern = r"^\d{1,2}. ?(.*)|^- ?(.*)|(.*)"
                prompt = re.findall(pattern, r)[0]
                prompt = [ p for p in prompt if len(p) > 0][0]
                if any(x in [":", "-"] for x in prompt):
                    prompt = prompt.split(":")[0]
                prompts.append({ "keyword": key, "prompt": prompt})

            res = {
                "response": prompts
            }
        return jsonify(res)




if __name__ == '__main__':
    app.run(debug=True, port=8088, host="0.0.0.0")
