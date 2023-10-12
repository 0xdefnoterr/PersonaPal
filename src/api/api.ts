// api BASE_URL +/api/v1 + methods
// we will use fetch, should we use classes or functions?


let PREFIX = "/api/v1/"

let endpoints = {
    "version": {type: "GET", url: PREFIX + "info/version"},
    "model": {type: "GET", url: PREFIX + "model"},
    "generate": {type: "POST", url: PREFIX + "generate"},
    "get_story": {type: "GET", url: PREFIX + "story"},
    "delete_story": {type: "DELETE", url: PREFIX + "story"},
}


let fetch_api = async (base_url: string, endpoint: string, body?: any) => {
    let url = base_url + endpoints[endpoint].url;
    let type = endpoints[endpoint].type;

    let options: any = {
        method: type,
        headers: {
            "Content-Type": 'application/json'
        }
    }
    if (body) options.body = JSON.stringify(body);

    try {
        let res = await fetch(url, options);
        let json = await res.json();
        return json;
    } catch (error) {
        return {error: error};
    }
}

export {fetch_api};