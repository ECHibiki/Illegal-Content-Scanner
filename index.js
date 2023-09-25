/* Bot looks at the recent posts on kissu.moe/qaden?/recent/ every N seconds */
// On startupt logs in to get the token
// Makes a request to the recent posts page to get the most recent post ID and confirm it works
// Parses the HTML generated and makes responses
    // Scans the post for the previous post ID it's seen
        // If it can't find it then will expand the search range by 10 until it's found
    // Perform heuristic checks on each new post to decide:
        // Report the post as potential spam
        // Look through the post for URLs or URLs that are being obscured
            // Access URL and check post body for spam keywords
            // Action options
                // Report the post as potential spam
                // Flag the post to be put into verification
        // Perform OCR through API requests to check for URLs placed in image
            // Access URL and check post body for spam keywords
            // Action options
                // Report the post as potential spam
                // Flag the post to be put into verification
    // Stores the most recent post ID it has seen for next loop

const util = require('util')
const https = require('https');
const htmlparser2 = require('htmlparser2');

var requestToken = "";
var lastRecognizedPost = "delete_";

login().then(() => {
    startRecents();
    setInterval(() => {
        scanRecentPosts()
        console.error("Error on scan" , error)
    }, SCAN_RATE_MS);
})

function startRecents(){
    console.log("starting recents");
    let r = https.request({
        hostname: HEAD_URL,
        port: 443,
        path: util.format(RECENT_POST_URL, 1),
        method: 'GET',
        headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Scan-Bot',
                'Cookie': util.format("mod=%s", requestToken),
            }
        }, (res) => {
            const body = []
            res.on('data', (chunk) => body.push(chunk))
            res.on('end', () => {
                const htmlBody = Buffer.concat(body).toString();
                const dom = htmlparser2.parseDocument(htmlBody);
                const posts = htmlparser2.DomUtils.getElements({ class: 'delete' }, dom, true);
    
                lastRecognizedPost = posts[0].attribs.id;
                if (typeof(lastRecognizedPost) != "string" || !lastRecognizedPost.includes("delete_")){
                    throw new Error('Could not parse last recognized post');
                } else{
                    console.log("Last recognized post: ", lastRecognizedPost);
                }
            })
    });
    r.end();
}

function scanRecentPosts(postQuantity = DEFAULT_RECENT_POSTS) {
    if(postQuantity > 50) {
        console.log("Could not find last recognized post, so reattaining");
        startRecents();
        return
    }
    let r = https.request({
        hostname: HEAD_URL,
        port: 443,
        path: util.format(RECENT_POST_URL, postQuantity),
        method: 'GET',
        headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Scan-Bot',
                'Cookie': util.format("mod=%s", requestToken),
            }
        }, (res) => {
            const body = []
            res.on('data', (chunk) => body.push(chunk))
            res.on('end', () => {
                const htmlBody = Buffer.concat(body).toString();
                const dom = htmlparser2.parseDocument(htmlBody);
                const del = htmlparser2.DomUtils.getElements( { id: lastRecognizedPost} , dom, true); 
                if(!del.pop()){
                    scanRecentPosts( postQuantity + DEFAULT_RECENT_POSTS )
                    return
                } else{
                    const posts = htmlparser2.DomUtils.getElements({ class: 'delete' }, dom, true);
                    for (let i = 0; i < posts.length; i++){
                        if (posts[i].attribs.id == lastRecognizedPost){
                            break
                        }
                        const scanPost = htmlparser2.DomUtils.getElements({class: "body"}, posts[i].parentNode.parentNode, true);
                        const board = posts[i].parentNode.parentNode.parentNode.attribs["data-board"]
                        scanForReportWords(scanPost.pop() , posts[i].attribs.id , board)
                    }
                    lastRecognizedPost = posts[0].attribs.id;
                    if (typeof(lastRecognizedPost) != "string" || !lastRecognizedPost.includes("delete_")){
                        throw new Error('Could not parse last recognized post');
                    }
                }   
           })
    });
    try {
        r.end();
    } catch (error) {
        console.log("ScanRecentPosts error" , error)
    }
    
}

function checkHeuristic(postText){
    let badCount = 0;
    MALREGEX.forEach( (regex) => {
        if (regex.test(postText)){
            badCount = 999;
        }
    });
    MALWORDS.forEach( (word) => {
        if (postText == (word)){
            badCount++;
        }
    })
    return badCount;
}

function scanForReportWords(post , deleteID , board){
    console.log("Scanning post for report words ---" , htmlparser2.DomUtils.textContent( post ) , deleteID , board);
    const TEXTBODY = htmlparser2.DomUtils.textContent( post );
    if( checkHeuristic( TEXTBODY.toLowerCase() ) > 3 ){
        // delete_10410
        const REPORT = util.format(REPORT_REQUEST,  board , deleteID, deleteID, "Autoreport: Looks illegal");
        console.log("reporting post" , REPORT , )
        let r = https.request({
            hostname: HEAD_URL,
            port: 443,
            path: RECENT_REPORT_URL,
            method: 'POST',
            headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Scan-Bot',
                }
            }, (res) => {
                console.log('REPORTED statusCode:', res.statusCode);
                if(res.statusCode != 200){
                    const body = []
                    res.on('data', (chunk) => body.push(chunk))
                    res.on('end', () => {
                        console.log(Buffer.concat(body).toString())
                        throw("ERROR WHEN REPORTING" , body)  
                    })
                }
            }
        );
        r.write(REPORT)
        r.end();
    }

}

async function login() {
    const LOGIN = util.format(LOGIN_REQUEST, BOT_NAME, PASSWORD);
    // const LOGIN = LOGIN_REQUEST;
    return new Promise( (recv) => { 
        let r = https.request({
        hostname: HEAD_URL,
        port: 443,
        path: LOGIN_URL,
        method: 'POST',
        headers: {
             'Content-Type': 'application/x-www-form-urlencoded',
             'User-Agent': 'Scan-Bot',
           }
        }, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            if (!res.headers['set-cookie']){
                console.log("Request failed" , LOGIN)
                const body = []
                res.on('data', (chunk) => body.push(chunk))
                res.on('end', () => {
                    // console.log(Buffer.concat(body).toString())
                    throw new Error('Headers missing data on login');
                })
            } else{
                requestToken = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
                console.log('requestToken:', requestToken);
                recv();
            }
        });
        r.write(LOGIN);
        r.end();
    })    
}