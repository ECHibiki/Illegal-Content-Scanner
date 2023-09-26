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


    // Verify program follows URLs and properly uses regex to evaluate if a post is spam or not
    // Clean up the program for readability sake
    
    // TODO: Add verification system to Vichan which will hide posts that are most likely illegal
        // Verify that the bot works properly to flag posts and hide them from users
        // Verify that reports are being sent when a post is flagged
    // TODO: Add OCR system to check images for URLs and follow them/report them
        // Verify that OCR is reading text on watermarked media
        // (spammer uses https://watermarkly.com/ to watermark images)
    
    // TODO: Improve regex check/heuristics system for an in production system.
    // Deploy to source

const util = require('util')
const https = require('https');
const htmlparser2 = require('htmlparser2');
const settings = require('./settings/settings');

var requestToken = "";
var lastRecognizedPost = "delete_";

login().then(() => {
    startRecents();
    setInterval(() => {
        scanRecentPosts()
        console.error("Error on scan" , error)
    }, settings.SCAN_RATE_MS);
})

function startRecents(){
    console.log("starting recents");
    let r = https.request({
        hostname: settings.HEAD_URL,
        port: 443,
        path: util.format(settings.RECENT_POST_URL, 1),
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

function scanRecentPosts(postQuantity = settings.DEFAULT_RECENT_POSTS) {
    if(postQuantity > 50) {
        console.log("Could not find last recognized post, so reattaining");
        startRecents();
        return
    }
    let r = https.request({
        hostname: settings.HEAD_URL,
        port: 443,
        path: util.format(settings.RECENT_POST_URL, postQuantity),
        method: 'GET',
        headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Scan-Bot',
                'Cookie': util.format("mod=%s", requestToken),
            }
        }, (res) => {
            const body = []
            res.on('data', (chunk) => body.push(chunk))
            res.on('end', async () => {
                const htmlBody = Buffer.concat(body).toString();
                const dom = htmlparser2.parseDocument(htmlBody);
                const del = htmlparser2.DomUtils.getElements( { id: lastRecognizedPost} , dom, true); 
                if(!del.pop()){
                    scanRecentPosts( postQuantity + settings.DEFAULT_RECENT_POSTS )
                    return
                } else{
                    const posts = htmlparser2.DomUtils.getElements({ class: 'delete' }, dom, true);
                    for (let i = 0; i < posts.length; i++){
                        if (posts[i].attribs.id == lastRecognizedPost){
                            break
                        }
                        const scanPost = htmlparser2.DomUtils.getElements({class: "body"}, posts[i].parentNode.parentNode, true);
                        const board = posts[i].parentNode.parentNode.parentNode.attribs["data-board"]
                        const textbody = htmlparser2.DomUtils.textContent( scanPost.pop() );
                        const deleteID = posts[i].attribs.id
                        let score = scanForReportWords(textbody ,);
                        if(score < 5){
                            score += await readIntoURLs(textbody , deleteID , board)
                            score += await requestOCRForImage(deleteID , board)
                        }
                        decideAction(score, deleteID , board)
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

function decideAction(score , deleteID , board){
    if( score  > 5 ){
        // Here we will flag the post for verification
        makeUnverified(deleteID , board);
    }
    if( score > 3 ){
        // delete_10410
        makeReport(deleteID , board);
    }
}

function checkHeuristic(postText){
    let badCount = 0;
    settings.MALREGEX.forEach( (regex) => {
        if (regex.test(postText)){
            badCount = 999;
        }
    });
    settings.MALWORDS.forEach( (word) => {
        if (postText.includes(word)){
            badCount++;
        }
    })
    return badCount;
}

async function readIntoURLs(post , deleteID , board){
    let urls = htmlparser2.DomUtils.getElementsByTagName("A", post, true);
    let score = 0;
    for(let i = 0 ; i < urls.length ; i++){
        const url = urls[i];
        if(url.attribs.href){
            if(url.attribs.href.includes("http")){
                console.log("Found URL" , url.attribs.href);
                score += await new Promise( (recv) => {
                    https.request({
                        url: start_url,
                        method: 'GET',
                        followAllRedirects: true,
                    }, function(res) {
                        if(res.statusCode == 200){
                            const body = []
                            res.on('data', (chunk) => body.push(chunk))
                            res.on('end', () => {
                                const dom = htmlparser2.parseDocument(Buffer.concat(body).toString());
                                let innerScore = this.checkHeuristic(dom.textContent , deleteID , board)
                                recv(innerScore)
                            })
                        }
                    });
                } )
            }
        }
    }
    return score
}

function scanForReportWords(textbody ){
    let score = checkHeuristic( textbody.toLowerCase() );
    return score
}

function makeUnverified(deleteID , board){
    const unverifification = util.format(settings.UNVERIFICATION_REQUEST,  board , deleteID);
    console.log("flagging post" , unverified , )
    let r = https.request({
        hostname: settings.HEAD_URL,
        port: 443,
        path: settings.RECENT_REPORT_URL,
        method: 'POST',
        headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Scan-Bot',
            }
        }, (res) => {
            console.log('UNVERIFIED statusCode:', res.statusCode);
            if(res.statusCode != 200){
                const body = []
                res.on('data', (chunk) => body.push(chunk))
                res.on('end', () => {
                    console.log(Buffer.concat(body).toString())
                    throw("ERROR WHEN UNVERIFYING" , body)  
                })
            }
        }
    );
    r.write(unverifification)
    r.end();
}
// send request to GPU server to download and process an  image
async function requestOCRForImage(deleteID, board){
    console.log("unimplemented")
    const score = await new Promise( (recv) => {
        https.request({
            hostname: settings.HEAD_URL,
            port: 443,
            path: settings.OCR_SERVER_URL,
            method: 'POST',
            headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Scan-Bot',
                }
            }, (res) => {
            console.log('UNVERIFIED statusCode:', res.statusCode);
            if(res.statusCode != 200){
                const body = []
                res.on('data', (chunk) => body.push(chunk))

                    res.on('end', () => {
                        console.log(Buffer.concat(body).toString())  
                        const ocrText = Buffer.concat(body).toString()
                        // TODO: Check the OCR text for URLs and report/flag them
                        // TODO: Check the OCR text for spam words and report/flag them
                        let ocrScore = scanForReportWords(ocrText );
                        if(score < 5){
                            ocrScore += readIntoURLs(ocrText , deleteID , board)
                        }
                        recv(ocrScore)
                    })
                }
            }
        );
    })
    r.write(unverifification)
    r.end();
    return score
}

function makeReport(deleteID , board){
    const report = util.format(settings.REPORT_REQUEST,  board , deleteID, deleteID, "Autoreport: Looks illegal");
    console.log("reporting post" , report , )
    let r = https.request({
        hostname: settings.HEAD_URL,
        port: 443,
        path: settings.RECENT_REPORT_URL,
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
    r.write(report)
    r.end();
}

async function login() {
    const login = util.format(settings.LOGIN_REQUEST, settings.BOT_NAME, settings.PASSWORD);
    // const LOGIN = LOGIN_REQUEST;
    return new Promise( (recv) => { 
        let r = https.request({
        hostname: settings.HEAD_URL,
        port: 443,
        path: settings.LOGIN_URL,
        method: 'POST',
        headers: {
             'Content-Type': 'application/x-www-form-urlencoded',
             'User-Agent': 'Scan-Bot',
           }
        }, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            if (!res.headers['set-cookie']){
                console.log("Request failed" , settings.LOGIN)
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
        r.write(login);
        r.end();
    })    
}