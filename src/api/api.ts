// api BASE_URL +/api/v1 + methods
// we will use fetch, should we use classes or functions?


const PREFIX = "/api/v1/"

const endpoints = {
    "version": {type: "GET", url: PREFIX + "info/version"},
    "model": {type: "GET", url: PREFIX + "model"},
    "generate": {type: "POST", url: PREFIX + "generate"},
    "get_story": {type: "GET", url: PREFIX + "story"},
    "delete_story": {type: "DELETE", url: PREFIX + "story"},
}

const chub_ai = "https://api.chub.ai/search?"
const chub_ai_character = "https://api.chub.ai/api/characters/"
const avatar_chub_ai = "https://avatars.charhub.io/avatars/"


const fetch_characters = async (page: number, tags: string[], search: string = "") => {
    const tags_query = tags.join(",");
    const url = `${chub_ai}search=${search}&first=1&topics=${tags_query}&excludetopics=Loli,Rape,Shota&page=${page}&sort=star_count&venus=false&min_tokens=50`
    try {
        const res = await fetch(encodeURI(url));
        return await res.json();
    } catch (error) {
        return {error: error};
    }
}

const get_character_avatar = (id: string) => {
    return `${avatar_chub_ai}${id}/chara_card_v2.png`;
}

const fetch_specific_character = async (id: string) => {
    const url = `${chub_ai_character}${id}?full=true`;
    try {
        const res = await fetch(encodeURI(url));
        return {data: await res.json(), avatar: `${avatar_chub_ai}${id}/chara_card_v2.png`};
    } catch (error) {
        return {error: error};
    }
}

const fetch_api = async (base_url: string, endpoint: string, body?: any) => {
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
        const res = await fetch(url, options);
        return await res.json();
    } catch (error) {
        return {error: error};
    }
}


const fun_api = {
    "endpoint": "http://api.nekos.fun:8080/api/",
    "sfw": {
        "smug": "smug",
        "slap": "slap",
        "feed": "feed",
        "poke": "poke",
        "wallpapers": "wallpapers",
    }
}

const fun_api_fetch = async (endpoint: string) => {
    const url = fun_api.endpoint + endpoint;
    try {
        const res = await fetch(url);
        return await res.json();
    } catch (error) {
        return {error: error};
    }
}

export {fetch_api, fetch_characters, fetch_specific_character, get_character_avatar, fun_api_fetch};