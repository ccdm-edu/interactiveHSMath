'''
Created on Sep 25, 2020

@author: Owner
'''
import json
import requests
import os

def read_bing_key():
    """
    reads the BING API key from a file called 'bing.key'
    Returns a string which is either None or the key
    """
    bing_api_key = None
    #Dont know why the server runs out of a totally different location than that expected
    # by pdf class file... but this is where the bing.key needs to be
    print(f"this is where we are {os.getcwd()}")
    try:
        with open('bing.key', 'r') as f:
            bing_api_key = f.readline().strip()
    except:
        try:
            with open('../bing.key') as f:
                bing_api_key = f.readline().strip()
        except:
            raise IOError('bing.key file not found')
        
    if not bing_api_key:
        raise KeyError('Bing key not found')
    
    return bing_api_key

def run_query(search_terms):
    """
        See the Microsoft's documentation on other parameters that you can set.
        http://bit.ly/twd-bing-api
    """
    bing_key = read_bing_key()
    search_url = 'https://api.cognitive.microsoft.com/bing/v7.0/search'
    headers = {'Ocp-Apim-Subscription-Key': bing_key}
    params = {'q':search_terms, 'textDecorations': True, 'textFormat': 'HTML'}
    
    #issue the request, given the details above
    response = requests.get(search_url, headers=headers, params=params)
    response.raise_for_status()
    search_results = response.json()
    
    # With the response now in play, build up a python list
    results = []
    for result in search_results['webPages']['value']:
        results.append({
            'title': result['name'],
            'link': result['url'],
            'summary': result['snippet']})
    return results

def main():
    # collect user input and output results
    searchTxt = input("input search terms in a string: \n")
    result = run_query(searchTxt)
    #print(f"The result is {result}")
    for entry in result:
        print(f"Title:  {entry['title']}")
        print(f"Link:  {entry['link']}")
        print(f"Summary: {entry['summary']}")
        print("---------------------------------------------------------------------\n")
    
if __name__ == '__main__':
    main()
