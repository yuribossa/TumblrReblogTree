# -*- coding: utf8 -*-

#   tumblr reblog tree visualize application
#   author:  yuribossa
#   contact: yuribossa@gmail.com
#   note:    This application for Google App Engine

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from google.appengine.api import urlfetch
import re
import logging

class FetchHandler(webapp.RequestHandler):
    def post(self):
        url = self.request.get('url')
        # TumblrのHostname取得
        base_url = re.compile('(http://[\w-]+\.tumblr\.com)').search(url)
        if not base_url:
            self.error(500)
            return
        base_url = base_url.group(1)

        res = urlfetch.fetch(url)
        if res.status_code != 200:
            self.error(500)
            return

        # NotesのURL取得
        notes_url = re.compile('(/notes/\d+/\w+)\?').search(res.content)
        if not notes_url:
            self.error(500)
            return
        url = base_url + notes_url.group(1)
        result = ''
        # 全てのNotes取得
        while True:
            res = urlfetch.fetch(url)
            if res.status_code != 200:
                self.error(500)
                break

            result += res.content
            notes_url = re.compile('(/notes/\d+/\w+\?from_c=\d+)').search(res.content)
            if not notes_url:
                self.response.out.write(result)
                return
            url = base_url + notes_url.group(1)

HTML = """
<!DOCTYPE html>
<html>
<head>
<title>tumblr reblog tree</title>
<link rel='stylesheet' href='/css/style.css' />
<script type="text/javascript" src="http://code.jquery.com/jquery-1.7.1.min.js"></script>
</head>
<body>
<p>This is Tumblr reblog tree visualize application.</p>
<img src="/img/showmorenotes.jpg" />
<p>Required "Show more notes" part in tumblr post page.</p>
<form onsubmit="return false;">
<input type="text" id="inputUrl" />
<input type="submit" id="submit" value="Get reblog tree" />
</form>
<p id="loading" style="display: none;">Loading...</p>
<p id="error" style="display: none;">Error &gt;&lt;</p>
<div id="result">
</div>
<script type="text/javascript" src="/js/reblogtree.js"></script>
</body>
</html>
"""

class TopHandler(webapp.RequestHandler):
    def get(self):
        self.response.out.write(HTML)

application = webapp.WSGIApplication(
    [('/getnotes', FetchHandler)
     , ('/', TopHandler)],
    debug = True)

def main():
    run_wsgi_app(application)

if __name__ == '__main__':
    main()

