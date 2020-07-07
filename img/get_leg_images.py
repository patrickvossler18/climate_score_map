import requests as req
from bs4 import BeautifulSoup
import re
import json
import os
import subprocess
import pathlib
import csv
import glob
import pandas as pd
import us
from num2words import num2words
from word2number import w2n

# start with this url, get all of the states from the options and then scrape the images
starter_url = "https://openstates.org/ca/legislators/"

get_req = req.get(starter_url)

soup = BeautifulSoup(get_req.content)

problem_states = ['al', 'ct']

state_list = [option['value'] for option in soup.find_all('option') if option['value'] not in problem_states]

for state in state_list:
    print(state)
    base_url = f"https://openstates.org/{state}/legislators/"
    img_page_html = req.get(base_url).text
    chambers_re = re.search(r"window.chambers\s*=\s*(\{.*?\});", img_page_html)
    if chambers_re.group(1) is not None:
        chamber_dict = json.loads(chambers_re.group(1))
    else:
        print(f"OH NO! could not find chamber dictionary for {state}")
        break
    legislators_re = re.search(r"window.legislators\s*=\s*(\[\{.*?\}\]);", img_page_html)
    if legislators_re.group(1) is not None:
        print(f"found legislators json")
        legis_compiled= []
        legislator_data = json.loads(legislators_re.group(1).strip())
        directory = f"img/originals/{state}/"
        pathlib.Path(directory).mkdir(parents=True, exist_ok=True)
        for legislator in legislator_data:
            # get the image, download it, add path to compiled info
            image_url = legislator['image']
            if len(image_url) != 0:
                image_file_name = os.path.basename(image_url)
                image_file_path = f"{directory}{image_file_name}"
                image_file = None
                if not os.path.isfile(image_file_path):
                    stat_code = None
                    try:
                        if state == "ma":
                            image_file = req.get(image_url, verify=False)
                        else:
                            image_file = req.get(image_url)
                        stat_code = image_file.status_code
                    except req.exceptions.ConnectionError as err:
                        print(f"got error connection error for {state}: {legislator['name']}")
                    finally:
                        if stat_code == 200 or stat_code is not None:

                            with open(image_file_path, 'wb') as f:
                                f.write(image_file.content)

                compiled_info = {
                    "name": legislator['name'],
                    "image_filepath": image_file_path if image_file is not None else None,
                    "original_image_url": legislator['image'],
                    "party": legislator['current_role']['party'],
                    "state": legislator['current_role']['state'],
                    "chamber": chamber_dict.get(legislator['current_role']['chamber'],None),
                    "district": legislator['current_role']['district']
                    }
                legis_compiled.append(compiled_info)

            else:
                print(f"no image url for {state}: {legislator['name']}? Found {image_url}")
        if len(legis_compiled) > 0:
            dict_keys = legis_compiled[0].keys()
            with open(f"{directory}/{state}_legislators.csv", "w") as output_csv:
                dict_writer = csv.DictWriter(output_csv, dict_keys)
                dict_writer.writeheader()
                dict_writer.writerows(legis_compiled)
    else:
        print(f"didn't find window.legislators for {state}")

# make the images smaller
subprocess.call("img/resize_images.sh", shell=True)

all_csvs_path = glob.glob("/Users/patrick/nra_score_map/img/resized/**/*.csv", recursive=True)
leg_image_info = pd.concat([pd.read_csv(path) for path in all_csvs_path])

leg_image_info['image_filepath'] = leg_image_info['image_filepath'].str.replace("/Users/patrick/nra_score_map/","")
leg_image_info['geoid'] = leg_image_info['state'].str.upper().map(lambda x: us.states.lookup(x).fips)
leg_image_info.reset_index(inplace=True, drop=True)
leg_image_info.to_json("/Users/patrick/nra_score_map/data/leg_image_info.json",orient='records')


### read in csv of geo id info
lower_info = pd.read_csv("/Users/patrick/nra_score_map/data/lower_id_info.csv")


def convert_district_to_num(x):
    found_int = re.match(r'(\d+)st|nd|rd|th', x)
    if found_int is not None:
        replacement = num2words(found_int.group(1),ordinal=True)
        return f"{replacement} {x.split(' ')[1]}".lower()
    else:
        return x

lower_info['NAME'].map(lambda x: convert_district_to_num(x)).unique()

leg_image_info['district'].map(lambda x: w2n.word_to_num(str(x)))
