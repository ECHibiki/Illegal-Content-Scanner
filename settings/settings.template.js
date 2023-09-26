
 const  MALWORDS = [
    "PTHC",
    "CP",
    "CHILD",
    "PRETEEN",
    "PRE-TEEN",
    "PRE TEEN",
    "PEDO",
    "GB",
    "LOLI",
]

 const  MALREGEX = [
    /^(?: |\n|^)(?:https?:\/\/)?(?:www\.)?[a-z0-9\-_]{1,}\.[a-z]{1,}\/[a-z0-9]+\/?$/ig
]

 const  HEAD_URL = "kissu.moe";

 const  RECENT_REPORT_URL = "/post";
 const  REPORT_REQUEST = "report=1&board=%s&%s=%s&reason=%s";

 const  LOGIN_URL = "";
 const  LOGIN_REQUEST = "username=%s&password=%s&login=Continue"

 const  BOT_NAME = "Scan-Bot";
 const  PASSWORD = "=";

 const  RECENT_POST_URL = "";
 const  DEFAULT_RECENT_POSTS = 10;
 const  SCAN_RATE_MS = 30 * 1000;

 module.exports = {
    MALWORDS, MALREGEX, HEAD_URL, RECENT_POST_URL, RECENT_REPORT_URL, REPORT_REQUEST, LOGIN_URL, LOGIN_REQUEST, 
    BOT_NAME, PASSWORD, DEFAULT_RECENT_POSTS, SCAN_RATE_MS
}