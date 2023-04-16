import re
import os
import json
import openai
from flask import Flask, redirect, render_template, request, url_for, make_response, jsonify
from flask_cors import CORS, cross_origin
from pymongo import MongoClient

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
model_type = "gpt-3.5-turbo"
tempature = 0.6
max_tokens = 2048
enablePreload = False
test = False

client = MongoClient(
    'mongodb+srv://zhengzhang:950117@research.xvi5gpd.mongodb.net/?retryWrites=true&w=majority')
db = client.gptwriting

with open('openai_key.json') as key_file:
    openai.api_key = json.load(key_file)['key']

@app.route("/login", methods=["POST"])
def login():
    if request.method == "POST":
        response = request.get_json()
        username = response["username"]
        password = response["password"]
        condition = response["condition"]
        print(f"username: {username}, password: {password}")
        user = db.users.find_one({"username": username})
        if user is None:
            print("User not found")
            return jsonify({"status": "fail", "message": "User not found"})
        if user["password"] != password:
            print("Password incorrect")
            return jsonify({"status": "fail", "message": "Password incorrect"})
        print("Login successfully")
        # load state from database

        topicId = user["condTopicMapping"][condition]

        problem = db.problemset.find_one({"id": topicId})

        if user["latestSessionId"] != -1 and enablePreload:
            state = db.drafts.find_one(
                {"username": username, "sessionId": user["latestSessionId"]})
            return jsonify({"status": "success", "message": "Login successfully", "preload": True, "editorState": state["editorState"], "flowSlice": state["flowSlice"], "editorSlice": state["editorSlice"], "taskProblem": problem["topic"], "taskDescription": problem["description"]})
        else:
            return jsonify({"status": "success", "message": "Login successfully", "preload": False, "editorState": "", "flowSlice": "", "editorSlice": "", "taskProblem": problem["topic"], "taskDescription": problem["description"]})

@app.route("/logInteractionData", methods=["POST"])
def logInteractionData():
    if request.method == "POST":
        response = request.get_json()
        username = response["username"]
        sessionId = response["sessionId"]
        type = response["type"]
        interactionData = response["interactionData"]
        db.interactionData.insert_one(
            {"username": username, "sessionId": sessionId, "type": type, "interactionData": interactionData})
        return jsonify({"status": "success", "message": "Interaction data logged successfully"})

@app.route("/loadDraft", methods=["POST"])
def loadDraft():
    if request.method == "POST":
        response = request.get_json()
        username = response["username"]
        user = db.users.find_one({"username": username})
        if user is not None:
            sessionId = user["latestSessionId"]
            state = db.drafts.find_one(
                {"username": username, "sessionId": sessionId})
            if state is None:
                print("Draft not found")
                return jsonify({"status": "fail", "message": "Draft not found"})
            print("Draft loaded successfully")
            return jsonify({"status": "success", "message": "Draft loaded successfully", "editorState": state["editorState"], "flowSlice": state["flowSlice"], "editorSlice": state["editorSlice"]})
        else:
            print("User not found")
            return jsonify({"status": "fail", "message": "User not found"})

@app.route("/saveDraft", methods=["POST"])
def saveDraft():
    if request.method == "POST":
        response = request.get_json()
        username = response["username"]
        sessionId = response["sessionId"]
        draft = response["draft"]
        depGraph = response["depGraph"]
        editorState = response["editorState"]
        flowSlice = response["flowSlice"]
        editorSlice = response["editorSlice"]
        condition = response["condition"]
        # depGraph = json.loads(response["depGraph"])

        db.drafts.replace_one({"username": username, "sessionId": sessionId}, {
                              "username": username, "sessionId": sessionId, "draft": draft, "condition": condition, "depGraph": depGraph, "editorState": editorState, "flowSlice": flowSlice, "editorSlice": editorSlice}, upsert=True)

        db.users.update_one({"username": username}, { "$set": { "latestSessionId" : sessionId  }})

        return jsonify({"status": "success", "message": "Draft saved successfully"})


def implementSupportingArgument(supportingArgument, argumentSupported):

    if test:
        return "This is a test mode response (SA)"

    messages = [
        {"role": "system", "content": "You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to support an argument by considering a provided supporting argument."},
        {"role": "user", "content": f'''Please write a paragraph that supports the argument: "{argumentSupported}" by realizing the following kind of supporting evidence: "{supportingArgument}"'''},
    ]

    # prompt = f'''Please list the counter arguments that can challenge the argument: "Houston is a good city because it has a convenient transportaion and afforable living cost"'''
    response = openai.ChatCompletion.create(
        model=model_type,
        messages=messages,
        temperature=tempature,
        max_tokens=max_tokens
    )

    return response.choices[0].message.content.strip().replace("\n", " ")


def implementCounterArgument(keyword, counterArgument, argumentAttacked):

    print("called implementCounterArgument")

    if test:
        return "This is a test mode response (CA)"

    messages = [
        {"role": "system", "content": "You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to argue against an argument by considering a provided counter argument."},
        {"role": "user", "content": f'''Please write a paragraph that argues against the argument: "{argumentAttacked}" by considering the following counter argument: "{counterArgument}" from the perspective of {keyword}'''},
    ]

    # prompt = f'''Please list the counter arguments that can challenge the argument: "Houston is a good city because it has a convenient transportaion and afforable living cost"'''
    response = openai.ChatCompletion.create(
        model=model_type,
        messages=messages,
        temperature=tempature,
        max_tokens=max_tokens
    )

    return response.choices[0].message.content.strip().replace("\n", " ")


def implementElaboration(prompt, context):

    if test:
        return "This is a test mode response (Elaboration)"

    messages = [
        {"role": "system", "content": f'''You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to elaborate on a particular given discussion point to support my argument.'''},
        {"role": "user", "content": f'''Please write a paragraph that elaborates on my argument "{context}" by considering the following discussion point "{prompt}":'''}
    ]

    response = openai.ChatCompletion.create(
        model=model_type,
        messages=messages,
        temperature=tempature,
        max_tokens=max_tokens
    )

    return response.choices[0].message.content.strip().replace("\n", " ")


def generateStartingSentence(keyword, discussionPoints, globalContext):

    if test:
        return "This is a test mode response (Starting Sentence)"

    messages = [
        {"role": "system", "content": f'''You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to write a starting sentence of the paragraph that support user's argument from a particular perspective.'''},
        {"role": "user", "content": f'''Write a starting sentence for the paragraph that elaborates on the argument {globalContext} from the perspective of {keyword}'''}
    ]

    response = openai.ChatCompletion.create(
        model=model_type,
        messages=messages,
        temperature=tempature,
        max_tokens=max_tokens
    )

    return response.choices[0].message.content.strip().replace("\n", " ")


@app.route("/implementTopicSentence", methods=["POST"])
def implementTopicSentence():
    if test:
        return "This is a test mode response (Topic Sentence)"

    response = request.get_json()
    prompt = response['prompt']

    messages = [
        {"role": "system", "content": f'''You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to elaborate on a particular given discussion point to support my argument.'''},
        {"role": "user", "content": f'''Please write a sentence that claim my argument "{prompt}":'''}
    ]

    response = openai.ChatCompletion.create(
        model=model_type,
        messages=messages,
        temperature=tempature,
        max_tokens=max_tokens
    )

    res = {
            "response": response.choices[0].message.content.strip().replace("\n", " ")
    }

    return jsonify(res)


def generateTopicSentence(prompt, context):
    if test:
        return "This is a test mode response (Elaboration)"

    messages = [
        {"role": "system", "content": f'''You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to elaborate on a particular given discussion point to support my argument.'''},
        {"role": "user", "content": f'''Please write a sentence that claim my argument "{prompt}":'''}
    ]

    response = openai.ChatCompletion.create(
        model=model_type,
        messages=messages,
        temperature=tempature,
        max_tokens=max_tokens
    )

    return response.choices[0].message.content.strip().replace("\n", " ")

@app.route("/implementCounterArgument", methods=["POST"])
def gpt_implement_counter_argument():

    if test:
        return "This is a test mode response (Starting Sentence)"

    if request.method == "POST":
        response = request.get_json()
        counterArgument = response["prompt"]
        argumentAttacked = response["context"]

        messages = [
            {"role": "system", "content": "You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to argue against an argument by considering a provided counter argument."},
            {"role": "user", "content": f'''Plesae write a paragraph that argues against the argument: "{argumentAttacked}" by considering the following counter argument: "{counterArgument}"'''},
        ]

        # prompt = f'''Please list the counter arguments that can challenge the argument: "Houston is a good city because it has a convenient transportaion and afforable living cost"'''
        response = openai.ChatCompletion.create(
            model=model_type,
            messages=messages,
            temperature=tempature,
            max_tokens=max_tokens
        )

        res = {
            "response": response.choices[0].message.content.strip().replace("\n", " ")
        }

        return jsonify(res)


@app.route("/implementSupportingArgument", methods=["POST"])
def gpt_implement_supporting_argument():

    if test:
        return "This is a test mode response (Starting Sentence)"

    if request.method == "POST":
        response = request.get_json()
        supportingArgument = response["prompt"]
        argumentSupported = response["context"]

        messages = [
            {"role": "system", "content": "You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to support an argument by considering a provided supporting argument."},
            {"role": "user", "content": f'''Please write a paragraph that supports the argument: "{argumentSupported}" by realizing the following kind of supporting evidence: "{supportingArgument}"'''},
        ]

        # prompt = f'''Please list the counter arguments that can challenge the argument: "Houston is a good city because it has a convenient transportaion and afforable living cost"'''
        response = openai.ChatCompletion.create(
            model=model_type,
            messages=messages,
            temperature=tempature,
            max_tokens=max_tokens
        )

        res = {
            "response": response.choices[0].message.content.strip().replace("\n", " ")
        }

        return jsonify(res)


@app.route("/implementElaboration", methods=["POST"])
def gpt_implement_elaboration():

    if test:
        return "This is a test mode response (Starting Sentence)"

    if request.method == "POST":
        response = request.get_json()
        prompt = response["prompt"]
        context = response["context"]

        messages = [
            {"role": "system", "content": f'''You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to elaborate on a particular given discussion point to support my argument.'''},
            {"role": "user", "content": f'''Please write a paragraph that elaborates on my argument "{context}" by considering the following discussion point "{prompt}":'''}
        ]

        response = openai.ChatCompletion.create(
            model=model_type,
            messages=messages,
            temperature=tempature,
            max_tokens=max_tokens
        )

        res = {
            "response": response.choices[0].message.content.strip().replace("\n", " ")
        }

        return jsonify(res)


@app.route("/implementKeyword", methods=["POST"])
def gpt_keyword_sentence():

    if test:
        return "This is a test mode response (Starting Sentence)"

    if request.method == "POST":
        response = request.get_json()
        prompt = response["prompt"]
        context = response["context"]

        print("[implement keyword] request: ", response)

        messages = [
            {"role": "system", "content": f'''You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to write a starting sentence of the paragrah that support user's argument from a particular perspective.'''},
            {"role": "user", "content": f'''Write a starting sentence for the paragraph that elaborates on the argument {context} from the perspective of {prompt}'''}
        ]

        response = openai.ChatCompletion.create(
            model=model_type,
            messages=messages,
            temperature=tempature,
            max_tokens=max_tokens
        )

        res = {
            "response": response.choices[0].message.content.strip().replace("\n", " ")
        }

        return jsonify(res)


@app.route("/", methods=["GET", "POST"])
def gpt_inference():
    if request.method == "GET":
        prompt = request.args.get("prompt")
        response = openai.ChatCompletion.create(
            model=model_type,
            prompt=prompt,
            temperature=tempature,
            max_tokens=max_tokens
        )
        print(f"response: {response.choices[0].text}")
        res = {
            "response": response.choices[0].text.strip()
        }
        return jsonify(res)


@app.route("/keyword", methods=["POST"])
def gpt_fetch_keywords():

    print("[keyword] request: ", request)
    # test mode
    if test == True:
        return jsonify({"response": ["Quality of life", "Economy", "Population", "Education", "Location", "Safety", "Job opportunity"]})

    if request.method == "POST":
        response = request.get_json()
        prompt = response["prompt"]

#         elaborate_example = '''
# Aspects for for elaborating: "Houston is a good city":
# 1. Quality of life
# 2. Economy
# 3. Population
# 4. Education
# 5. Location
# 6. Safety
# 7. Job opportunity

# Aspects for elaborating: "Computer Science is a good major":
# 1. Social demand
# 2. Job opportunity
# 3. Promise
# 4. Salary
# 5. Enrollment
# 6. Popularity
# 7. Job security
#         '''

#         evidence_example = '''
# Types of evidence for supporting: "South Bend is a great city to live in in terms of cost of living":
# 1. Cost of living index
# 2. Average rent prices
# 3. Cost of goods and services
# 4. Average salary
# 5. Testimonials
# 6. Job opportunities
#         '''

        print(f"prompt: {prompt}")

        messages = [
            {"role": "system", "content": "You are a helpful writing assistant. You are given a argument and need to think of key aspects to elaborate on or evidence to support the argument."},
            {"role": "user", "content": '''Please list key aspects that are worth to discuss in order to support argument: "Houston is a good city"'''},
            {"role": "assistant", "content": '''
1. Quality of life
2. Economy
3. Population
4. Education
5. Location
6. Safety
7. Job opportunity'''},
            {"role": "user", "content": '''Please list key aspects that are worth to discuss in order to support argument: "Computer Science is a good major"'''},
            {"role": "assistant", "content": '''
1. Social demand
2. Job opportunity
3. Promise
4. Salary
5. Enrollment
6. Popularity
7. Job security'''},
            {"role": "user", "content": f'''Please list key aspects that are worth to discuss in order to support argument: "{prompt}"'''},
        ]

        # if mode == "elaborate":
        #     prompt = elaborate_example + "\n\n" + "Aspects for elaborating: " + prompt
        # if mode == "evidence":
        #     prompt = evidence_example + "\n\n" + "Types of evidence for supporting: " + prompt

        response = openai.ChatCompletion.create(
            model=model_type,
            messages=messages,
            temperature=tempature,
            max_tokens=max_tokens
        )

        res = response.choices[0].message.content.strip()

        print(f"response: {res}")
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
            keyword = [k for k in keyword if len(k) > 0][0]

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
        res = []

        print("[prompts] request: " + str(response))

        # test mode

        if test == True:
            res = []
            for key in keywords:
                res.append(
                    {"keyword": key, "prompt": "What is the relationship between " + key + " and " + context + "?"})
            return jsonify({"response": res})

        # dev mode
        for key in keywords:

            messages = [
                {"role": "system", "content": "You are a helpful writing assistant. You are given a pair of argument and perspective, you need to think of key discussion points from the perspective to support the given argument."},
                {"role": "user", "content": '''Please list key discussion points that are worth to include in order to support arguemnt: "Houston is a good city" from perspective of transportation'''},
                {"role": "assistant", "content": f'''
1. Public transportation system in Houston
2. Initiatives or plans to improve the public transportation infrastructure in Houston
3. Bicycle or walking paths that connect the different parts of the city
4. Convenience to get around Houston without a car
5. Public affordable transportation options
6. Transportation options that can help reduce traffic congestion in Houston'''},
                {"role": "user", "content": '''Please list key discussion points that are worth to include in order to support arguemnt: "Notre Dame is a great school to attend" from perspective of academic exllenence'''},
                {"role": "assistant", "content": f'''
1.High quality educational programs and curricula
2. Low student-to-faculty ratio
3. Research opportunities and resources
4. Extracurricular activities
5. Access to specialized facilities
6. Highly qualified and experienced faculty members'''},
                {"role": "user", "content": f'''Please list key discussion points that are worth to include in order to support arguemnt: "{context}" from perspective of {key}'''},
            ]

            response = openai.ChatCompletion.create(
                model=model_type,
                messages=messages,
                temperature=tempature,
                max_tokens=max_tokens
            )
            print(
                f"DP response: {response.choices[0].message.content.strip()}")

            res = response.choices[0].message.content.strip().splitlines()
            for index, r in enumerate(res):
                if len(r) == 0:
                    continue
                if index == 0 and (not r[0].isdigit() or r[0] != "-"):
                    continue
                # print(f"Line: {r}")
                pattern = r"^\d{1,2}. ?(.*)|^- ?(.*)|(.*)"
                prompt = re.findall(pattern, r)[0]
                prompt = [p for p in prompt if len(p) > 0][0]
                if any(x in [":", "-"] for x in prompt):
                    prompt = prompt.split(":")[0]
                prompts.append({"keyword": key, "prompt": prompt})

            res = {
                "response": prompts
            }
        return jsonify(res)


@app.route("/rewrite", methods=["POST"])
def gpt_rewrite():
    if request.method == "POST":
        response = request.get_json()
        print("response: ", response)

        mode = response["mode"]
        curSent = response["curSent"]

        print("[rewrite] request: ", response)

        if test:
            return "This is a test mode response (Starting Sentence)"

        res = {}

        if mode == "alternative":

            prompt = response["basePrompt"]

            messages = [
                {"role": "system", "content": "You are a helpful writing assistant. You are trying to rephrase a sentence in a different way."},
                {"role": "user", "content": f"Rephrase the following sentence in a different way: {curSent}"}
            ]

            prompt = f"Rephrase the following sentence in a different way: {curSent}"
            print(f"[/rewrite] prompt: {prompt}")
            response = openai.ChatCompletion.create(
                model=model_type,
                messages=messages,
                temperature=tempature,
                max_tokens=max_tokens,
                n=8
            )

            candidates = [response.choices[i].message.content.strip().replace("\n", "")
                          for i in range(min(8, len(response.choices)))]
            res["candidates"] = candidates

        if mode == "refine":

            furInstruction = response["furInstruction"]

            messages = [
                {"role": "system", "content": "You are a helpful writing assistant. You are trying to refine a sentence with user instruction."},
                {"role": "user", "content": f'''Rephrase the following sentence "{curSent}" with the instruction: "{furInstruction}"'''}
            ]

            response = openai.ChatCompletion.create(
                model=model_type,
                messages=messages,
                temperature=tempature,
                max_tokens=max_tokens,
                n=8
            )

            candidates = [response.choices[i].message.content.strip().replace("\n", "")
                          for i in range(min(8, len(response.choices)))]
            res["candidates"] = candidates

        if mode == "fix":
            weaknesses = response["weaknesses"]
            messages = [
                {"role": "system", "content": "You are a helpful writing assistant. You are trying to fix the mentioned logical weaknesses in my argument."},
                {"role": "user",
                    "content": f'''I just made an argument: {curSent}. I know this argument has the following logical weaknesses: {"; ".join(weaknesses)}. Rewrite the argument to fix the logical weaknesses.'''''}
            ]

            response = openai.ChatCompletion.create(
                model=model_type,
                messages=messages,
                temperature=tempature,
                max_tokens=max_tokens,
                n=8
            )

            candidates = [response.choices[i].message.content.strip().replace("\n", "")
                          for i in range(min(8, len(response.choices)))]

            candidates = [
                c.split(":")[1] if ":" in c else c for c in candidates]

            res["candidates"] = candidates

        print("fix res:", res["candidates"])

        return jsonify(res)


@app.route("/getWeakness", methods=["POST"])
def gpt_weakness_type():
    req = request.get_json()
    print(req)

    # test mode
    if test == True:
        return jsonify({"response": ["Quality of life", "Economy", "Population", "Education", "Location", "Safety", "Job opportunity"]})

    prompt = req["context"]

    elaborate_example = '''
Based on the argumentation theory, find logical weaknesses of the argument: "Houston is a good city to live in because it has convenient transportation"
1. Lack of evidence: The argument does not provide any evidence to support the claim that Houston has convenient transportation. This lack of evidence weakens the argument's credibility.
2. Ambiguity: The argument does not clearly define what is meant by "convenient transportation." Does it refer to public transportation, highways, or something else? The lack of clarity weakens the argument.
3. Overgeneralization: The argument assumes that one aspect of a city (transportation) is enough to make it a "good" place to live in. This overgeneralization ignores other important factors such as cost of living, crime rates, job opportunities, and climate.
4. Lack of comparison: The argument does not compare Houston's transportation system to other cities. Without a comparison, it is difficult to determine if Houston's transportation is indeed convenient, or if it is just average or below average.
5. False premise: The argument assumes that convenient transportation is the most important factor for determining whether a city is "good" to live in. However, this may not be true for everyone. Some people may prioritize other factors such as cultural events, education, or community services.
6. Hasty conclusion: The argument jumps to the conclusion that Houston is a "good" city to live in based on only one factor, without fully considering all other factors that contribute to overall quality of life in a city.

Based on the argumentation theory, find logical weaknesses of the argument: "Notre Dame is a great school to attend because it has outstanding faculty"
1. Hasty generalization: The argument jumps to the conclusion that Notre Dame is a great school to attend based on only one factor, outstanding faculty, without fully considering all other factors that contribute to a school being great.
2. False cause: The argument implies that Notre Dame's greatness as a school is solely due to its outstanding faculty, without considering other important factors that contribute to a school's overall quality, such as facilities, resources, and student life.
3. Lack of evidence: The argument does not provide any evidence to support the claim that Notre Dame has outstanding faculty, making the argument's credibility weaker.
4. Ambiguity: The argument does not clearly define what is meant by "outstanding faculty." Does it refer to faculty members' research, teaching abilities, or something else? The lack of clarity weakens the argument.
5. Overgeneralization: The argument assumes that one aspect of a school (faculty) is enough to make it a "great" school to attend. This overgeneralization ignores other important factors such as tuition, campus life, location, and student resources.
6. False dichotomy: The argument presents a false dichotomy by implying that a school is either great or not great based solely on the quality of its faculty. This ignores the fact that there can be schools with great faculty that are not considered great overall due to other factors.
7. Subjectivity: The argument's claim that Notre Dame is a great school to attend is subjective and depends on individual opinions and preferences. What one person considers a great school may not be the same for another person.
8. Lack of specificity: The argument does not provide specific information about what makes Notre Dame's faculty outstanding, such as their teaching skills, research experience, or expertise in certain fields. This lack of specificity weakens the argument's claim that Notre Dame has outstanding faculty.
        '''

#     evidence_example = '''
# Types of evidence for supporting: "South Bend is a great city to live in in terms of cost of living":
# 1. Cost of living index
# 2. Average rent prices
# 3. Cost of goods and services
# 4. Average salary
# 5. Testimonials
# 6. Job opportunities
#         '''

    messages = [
        {"role": "system", "content": "You are a helpful writing assistant. You are trying to find logical weaknesses of the argument."},
        {"role": "user", "content": f"Find logical weaknesses of the argument: Houston is a good city to live in because it has convenient transportation"},
        {"role": "assistant", "content": '''
1. Lack of evidence: The argument does not provide any evidence to support the claim that Houston has convenient transportation. This lack of evidence weakens the argument's credibility.
2. Ambiguity: The argument does not clearly define what is meant by "convenient transportation." Does it refer to public transportation, highways, or something else? The lack of clarity weakens the argument.
3. Overgeneralization: The argument assumes that one aspect of a city (transportation) is enough to make it a "good" place to live in. This overgeneralization ignores other important factors such as cost of living, crime rates, job opportunities, and climate.
4. Lack of comparison: The argument does not compare Houston's transportation system to other cities. Without a comparison, it is difficult to determine if Houston's transportation is indeed convenient, or if it is just average or below average.
5. False premise: The argument assumes that convenient transportation is the most important factor for determining whether a city is "good" to live in. However, this may not be true for everyone. Some people may prioritize other factors such as cultural events, education, or community services.
6. Hasty conclusion: The argument jumps to the conclusion that Houston is a "good" city to live in based on only one factor, without fully considering all other factors that contribute to overall quality of life in a city.'''},
        {"role": "user", "content": "Find logical weaknesses of the argument: Notre Dame is a great school to attend because it has outstanding faculty"},
        {"role": "assistant", "content": '''
1. Hasty generalization: The argument jumps to the conclusion that Notre Dame is a great school to attend based on only one factor, outstanding faculty, without fully considering all other factors that contribute to a school being great.
2. False cause: The argument implies that Notre Dame's greatness as a school is solely due to its outstanding faculty, without considering other important factors that contribute to a school's overall quality, such as facilities, resources, and student life.
3. Lack of evidence: The argument does not provide any evidence to support the claim that Notre Dame has outstanding faculty, making the argument's credibility weaker.
4. Ambiguity: The argument does not clearly define what is meant by "outstanding faculty." Does it refer to faculty members' research, teaching abilities, or something else? The lack of clarity weakens the argument.
5. Overgeneralization: The argument assumes that one aspect of a school (faculty) is enough to make it a "great" school to attend. This overgeneralization ignores other important factors such as tuition, campus life, location, and student resources.
6. False dichotomy: The argument presents a false dichotomy by implying that a school is either great or not great based solely on the quality of its faculty. This ignores the fact that there can be schools with great faculty that are not considered great overall due to other factors.
7. Subjectivity: The argument's claim that Notre Dame is a great school to attend is subjective and depends on individual opinions and preferences. What one person considers a great school may not be the same for another person.
8. Lack of specificity: The argument does not provide specific information about what makes Notre Dame's faculty outstanding, such as their teaching skills, research experience, or expertise in certain fields. This lack of specificity weakens the argument's claim that Notre Dame has outstanding faculty.'''},
        {"role": "user", "content": f"Find logical weaknesses of the argument: {prompt}"},
    ]

    prompt = elaborate_example + "\n\n" + \
        f'''Based on the argumentation theory, find logical weaknesses of the argument: "Notre Dame is a great school to attend because it has outstanding faculty"'''

    response = openai.ChatCompletion.create(
        model=model_type,
        messages=messages,
        temperature=tempature,
        max_tokens=max_tokens
    )

    output = response.choices[0].message.content.strip().replace("\n\n", "\n")
    output = output.splitlines()

    resData = []

    pattern = r"^\d{1,2}. ?(.*)|^- ?(.*)|(.*)"
    for i in range(len(output)):
        if output[i][0].isdigit():
            matchedText = re.findall(pattern, output[i])[0]
            resData.append(matchedText[0])
        else:
            if ":" in output[i] and output[i][-1] != ":":
                resData.append(output[i].split(":")[1].strip())

    res = {"response": resData}
    return jsonify(res)


@app.route("/supportingArguments", methods=["POST"])
def gpt_supporting_argument():
    if request.method == "POST":
        response = request.get_json()
        context = response["context"]

        # test mode
        if test == True:
            return jsonify({"response": ["Quality of life", "Economy", "Population", "Education", "Location", "Safety", "Job opportunity"]})

        messages = [
            {"role": "system", "content": "You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to raise the supporting arguments or evidences for the given argument."},
            {"role": "user", "content": '''Please list kinds of supporting arguments or evidences that can increase the credibility of the argument: "The potential for computer scientists to create new technologies and applications that can change the world is immense. Computer science is a field that is constantly evolving, and its practitioners are tasked with finding new and innovative ways to solve problems and improve existing systems. From developing new software and applications to designing cutting-edge hardware, computer scientists have the ability to create products that can have a profound impact on society. For example, the rise of the internet and the rapid development of social media platforms have revolutionized the way people communicate and interact with one another. Similarly, advancements in artificial intelligence and machine learning have the potential to transform industries such as healthcare, transportation, and finance. In short, computer science is a field that offers unparalleled opportunities for innovation and has the potential to shape the future in profound ways."'''},
            {"role": "assistant", "content": '''
1. Statistics: Using statistical data to support the argument can improve its credibility. For instance, citing the percentage of computer scientists who have created technologies that have positively impacted society.
2. Expert opinion: Quoting respected experts or professionals in the field can lend credibility to the argument. For instance, referencing interviews with renowned computer scientists who have spoken about the potential of computer science to shape the future.
3. Historical examples: Citing historical examples of how computer science has influenced society can provide support for the argument. For example, referencing the development of the World Wide Web and how it has revolutionized the way people access and share information.
4. Case studies: Providing case studies of successful innovations in computer science can also bolster the argument. For example, discussing how machine learning algorithms have improved patient outcomes in the healthcare industry.
5. Research findings: Referring to recent research findings in computer science can add credibility to the argument. For example, citing studies that demonstrate how computer science is contributing to the advancement of various industries.
6. Personal experiences: Sharing personal experiences or anecdotes about the impact of computer science on society can help make the argument more relatable and compelling.
7. Comparisons: Making comparisons to other fields or technologies can also enhance the credibility of the argument. For example, comparing the potential impact of computer science to that of other technological breakthroughs like the invention of the printing press or the steam engine.
8. Real-world examples: Providing real-world examples of the impact of computer science on society can make the argument more tangible. For instance, discussing how social media has transformed the way people connect with each other or how self-driving cars are set to revolutionize the transportation industry.
9 Future projections: Discussing potential future developments in computer science and their potential impact on society can help bolster the argument. For example, speculating on the possibilities of a future where artificial intelligence is used to solve some of the world's most pressing problems.'''},
            {"role": "user", "content": f'''Please list kinds of supporting arguments or evidences that can increase the credibility of the argument: {context}"'''},
        ]

        response = openai.ChatCompletion.create(
            model=model_type,
            messages=messages,
            temperature=tempature,
            max_tokens=max_tokens
        )

        res = response.choices[0].message.content.strip()
        res = res.strip().splitlines()
        return jsonify({"response": res})


@app.route("/counterArguments", methods=["POST"])
def gpt_counter_argument():
    if request.method == "POST":
        response = request.get_json()
        context = response["context"]
        keyword = response["keyword"]

        # test mode
        if test == True:
            return jsonify({"response": ["Quality of life", "Economy", "Population", "Education", "Location", "Safety", "Job opportunity"]})

        messages = [
            {"role": "system", "content": "You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to raise the counter arguments for the given statement."},
            {"role": "user", "content": '''Please list the counter arguments that can challenge the argument: "Houston is a good city because it has a convenient transportaion and afforable living cost from the perspective of transportation"'''},
            {"role": "assistant", "content": '''
1. Lack of Comprehensive Public Transportation System: While Houston has public transportation options such as buses and light rail, the public transportation system is not comprehensive, and many areas of the city may not be well-served by these options. This can limit accessibility to jobs and other important destinations for residents who rely on public transportation.
2. Inadequate Bike Infrastructure: Houston has a relatively low bike score, indicating that the city's bike infrastructure may not be adequate for residents who prefer to bike for transportation. This can limit mobility options for some residents, particularly those who may not have access to a car
3. High Traffic Congestion: Despite having convenient transportation options, Houston is known for its high traffic congestion, particularly during rush hour. This can cause significant delays for commuters, particularly those who rely on public transportation or who must travel long distances to reach their destinations.
4. Poor Air Quality: Traffic congestion and other factors can contribute to poor air quality in Houston, which can have negative health effects on residents. This can be a particular concern for vulnerable populations such as children, the elderly, and those with respiratory problems.
5. Limited Options for Alternative Transportation: While Houston has some options for alternative transportation, such as bike sharing and car sharing programs, these options may not be widely available or accessible to all residents.
6. Lack of Walkability: Many areas of Houston are designed primarily for cars, which can make it difficult for residents to walk to their destinations. This can limit opportunities for exercise and may contribute to obesity and other health problems.'''},
            {"role": "user", "content": f'''Please list the counter arguments that can challenge the argument: "{context}" from the perspective of "{keyword}"'''},
        ]

        response = openai.ChatCompletion.create(
            model=model_type,
            messages=messages,
            temperature=tempature,
            max_tokens=max_tokens
        )

        res = response.choices[0].message.content.strip()
        res = res.strip().splitlines()
        return jsonify({"response": res})


# depdentency graph data structure:
'''
DepGraph = {
    "FlowNodeKey1": {
        "type": "type of relation with the parent node",
        "prompt": "prompt of the node / content of the corresponding node in the flow graph",
        "children": ["FlowNodeKey2", "FlowNodeKey3", ...] // list of children nodes,
        "isImplemented": whether or not the corresponding text has been generated for this node
        "parent": key of the parent node,
        "text": concrete text generated for this node, only those implemented nodes have this field
    },
    "FlowNodeKey2": {
        ...
    }
}
'''


@app.route("/completion", methods=["POST"])
def gpt_completion():
    if request.method == "POST":
        response = request.get_json()
        prompt = response["prompt"]
        print("compltion prompt: ", prompt)
        # test mode
        if test == True:
            return jsonify({"response": "The answer is 42."})

        messages = [
            {"role": "system", "content": "You are a helpful writing assistant focusing on argumentative essay tutoring. You are trying to complete the given prompt."},
            {"role": "user", "content": f'''Please complete the following prompt: "{prompt}"'''},
        ]

        response = openai.ChatCompletion.create(
            model=model_type,
            messages=messages,
            temperature=tempature,
            max_tokens=max_tokens
        )

        res = response.choices[0].message.content.strip()
        return jsonify({"completion": " "+res})

# generate text based on the given dependency graph


@app.route("/generateFromDepGraph", methods=["POST"])
def generateText():
    if request.method == "POST":
        response = request.get_json()
        depGraph = response["dependencyGraph"]
        # The flowNode key of the root of the dependency graph, which is usually a node that is already implemented
        rootKeys = response["rootKeys"]

        output = {}

        if len(rootKeys) == 0:
            output["error"] = "The root does not exist in the dependency graph"
            print("The root does not exist in the dependency graph")
            return jsonify(output)



        # generate text through BFS traversal
        visited = []
        queue = [root for root in rootKeys]

        print("dependency graph: ", depGraph)
        print("queue: ", queue)

        while queue:
            node = queue.pop(0)
            print("Current node: ", node)
            if node not in visited:
                if node not in depGraph:
                    raise Exception(
                        f"The node {node} does not exist in the dependency graph")
                visited.append(node)
                queue.extend(depGraph[node]["children"])
                print("visiting node: ", node)
                if not depGraph[node]["isImplemented"] or depGraph[node]["needsUpdate"]:
                    print("Unimplemented node: ", depGraph[node])
                    generation = None
                    # generate text for this node
                    prompt = depGraph[node]["prompt"]
                    parentKey = depGraph[node]["parent"]
                    if depGraph[node]["type"] != "root" and parentKey not in depGraph:
                        print("parent does not exist in graph")
                        output["error"] = "parent does not exist in graph"
                        output["depGraph"] = depGraph
                        return jsonify(output) 
                    parent = depGraph[parentKey] if depGraph[node]["type"] != "root" else None
                    # ASSUMPTION: the parent node is always implemented before its children
                    if depGraph[node]["type"] == "attackedBy":
                        # generate counter argument against the parent node

                        keywordNode = node
                        while (depGraph[keywordNode]["type"] != "featuredBy"):
                            keywordNode = depGraph[keywordNode]["parent"]

                        generation = implementCounterArgument(
                            depGraph[keywordNode]["prompt"], depGraph[node]["prompt"], parent["text"])
                    elif depGraph[node]["type"] == "elaboratedBy":
                        # generate elaboration of the parent node
                        generation = implementElaboration(
                            prompt, parent["text"])
                    elif depGraph[node]["type"] == "featuredBy":
                        # generate the starting sentence for the paragraph that this keyword is featured in
                        keyword = depGraph[node]["prompt"]
                        dps = [depGraph[dp_key]["prompt"]
                               for dp_key in depGraph[node]["children"]]
                        generation = generateStartingSentence(
                            keyword, dps, parent["text"])
                    elif depGraph[node]["type"] == "supportedBy":
                        # generate support for the parent node
                        generation = implementSupportingArgument(
                            prompt, parent["text"])
                    elif depGraph[node]["type"] == "root":
                        generation = generateTopicSentence(
                            depGraph[node]["prompt"], depGraph[node]["text"]
                        )

                    print(f"node: {node}, text: {generation}")
                    depGraph[node]["text"] = generation

        output["depGraph"] = depGraph
        print("generateFromDepGraph returned")
        return jsonify(output) 


@app.route("/generateFromSketch", methods=["POST"])
def get_generate_from_sketch():
    if request.method == "POST":
        response = request.get_json()
        globalContext = response["selectedPrompts"]
        keywords = response["keywords"]
        discussionPoints = response["discussionPoints"]
        depGraph = response["dependencyGraph"]

        print(f"depGraph: {depGraph}")

        output = {
            "keywords": keywords,
            "globalContext": globalContext,
            "discussionPoints": discussionPoints,
            "depGraph": depGraph,
            "startSents": {},
        }

        # test mode
        if test == True:
            generations = {}
            for k in keywords:
                if depGraph.get(k) is None or len(depGraph[k]) == 0:
                    continue
                for dp in depGraph[k]:
                    generations[dp["prompt"]
                                ] = "This is a test generation for " + dp["prompt"]
            output["generations"] = generations
            return jsonify(output)

        generations = {}

        for keyword in keywords:
            if depGraph.get(keyword) is None or len(depGraph[keyword]) == 0:
                continue
            startSent = generateStartingSentence(
                keyword, [d["prompt"] for d in depGraph[keyword]], globalContext)
            output["startSents"][keyword] = startSent
            for dp in depGraph[keyword]:
                gpt_prompt = f'''Please elaborate the argument "${globalContext}" from the perspective of ${keyword} by considering the following questions: ${dp["content"]}'''

                response = openai.ChatCompletion.create(
                    model=model_type,
                    prompt=gpt_prompt,
                    temperature=tempature,
                    max_tokens=max_tokens
                )
                generations[dp["prompt"]] = response.choices[0].text.strip()

        output["generations"] = generations
        return jsonify(output)


if __name__ == '__main__':
    app.run(debug=True, port=8088, host="0.0.0.0")
