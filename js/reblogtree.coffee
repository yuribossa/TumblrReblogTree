
###
#   tumblr reblog tree visualize application
#   author:  yuribossa
#   contact: yuribossa@gmail.com
###

###
木構造をHTMLで表示
###
printTree = (tree) ->
    print = (tr, html) ->
        html += "<ul>"
        html += "<li>" + tr.node.toUser
        for node in tr.leaf
            html = print node, html
        html += "</li>"
        html += "</ul>"
    html = print tree, ""
    jQuery("#result").append html

###
配列を木構造に変換
###
listToTree = (list) ->
    ###
    ルートノード取得
    ###
    root = {}
    reblogList = []
    for i in [0...list.length]
        if list[i].postUser
            root = list[i]
        else
            reblogList.unshift list[i]

    ###
    配列を階層毎の配列に変換
    ###
    node = root
    levelList = [[root]]
    for i in [0...reblogList.length]
        flg = false
        for j in [levelList.length-1..0]
            for k in [0...levelList[j].length]
                if reblogList[i].fromUser is levelList[j][k].toUser
                    if j == levelList.length - 1
                        levelList.push [reblogList[i]]
                    else
                        levelList[j+1].push reblogList[i]
                    flg = true
                    break
            if flg
                break
        if not flg
            console.log "Not found reblog connection: " + reblogList[i].toUser + " reblogged from " + reblogList[i].fromUser

    ###
    木構造にノード追加
    ###
    makeTree = (tree, node, level1, level2) ->
        #console.log "makeTree: " + tree.node.toUser + " " + node.toUser + " " + node.fromUser + " " + level1 + " " + level2
        if tree.node.toUser is node.fromUser and level1 + 1 == level2
            tree.leaf.push {node: node, leaf: []}
            return true
        else
            if tree.leaf.length
                for i in [0...tree.leaf.length]
                    res = makeTree tree.leaf[i], node, level1+1, level2
                    if res
                        return true
        return false

    tree =
        node: levelList[0][0]
        leaf: []
    for i in [1...levelList.length]
        for j in [0...levelList[i].length]
            makeTree tree, levelList[i][j], 0, i

    return tree

###
サーバから届いたデータを配列に変換
###
htmlToList = (data) ->
    notesInfo = []
    likesInfo = []
    while true
        info = (data.match(/(<li.+?<\/li>)/)||[])[1]||null
        if not info
            break
        data = RegExp.rightContext
        ###
        Reblogの情報かチェック
        ###
        if /<li class=" note reblog.+>.+?<\/li>/.test(info)
            matchObj = info.match /^<li.+?<a href="(http:\/\/.+?)".+?title="(.+?)".+?img src="(http:\/\/.+?)".*?><\/a>.+?<a.+?>(.+?)<\/a>.+?reblogged.+?<a href="(http:\/\/.+?)".+?title="(.+?)".*?>(.+?)<\/a>.+?<\/li>\s*$/
            if matchObj
                if not matchObj[4]
                    console.log matchObj
                obj =
                    toUrl: matchObj[1]
                    toTitle: matchObj[2]
                    toAvatar: matchObj[3]
                    toUser: matchObj[4]
                    fromUrl: matchObj[5]
                    fromTitle: matchObj[6]
                    fromUser: matchObj[7]
            else
                ###
                オリジナルポストかチェック
                ###
                matchObj = info.match /^<li.+?<a href="(http:\/\/.+?)".+?title="(.+?)".+?img src="(http:\/\/.+?)".*?><\/a>.+?<a href="(http:\/\/.+?)".+?title="(.+?)".*?>(.+?)<\/a>.+?posted this.+?<\/li>\s*$/
                if matchObj
                    obj =
                        postUrl: matchObj[1]
                        postTitle: matchObj[2]
                        postAvatar: matchObj[3]
                        postUser: matchObj[6]
                        toUrl: matchObj[1]
                        toTitle: matchObj[2]
                        toAvatar: matchObj[3]
                        toUser: matchObj[6]
            notesInfo.push obj
        else
            likesInfo.push info
    return notesInfo


###
Submitボタン押下時のAjaxのCallback
###
callback = (data) ->
    data = data.replace /[\r\n]/g, ""
    data = data.replace /\s+/g, " "
    list = htmlToList data
    tree = listToTree list
    jQuery("#loading").hide()
    printTree tree

###
Submitボタン押下時のAjax
###
getNotes = () ->
    url = jQuery("#inputUrl").val()
    jQuery("#inputUrl").val("")
    jQuery("#result").empty()
    jQuery("#loading").show()
    jQuery.ajax({
        url: "/getnotes"
        type: "POST"
        data:
            url: url
        success: callback
        error: (req, textStatus, errorThrown) ->
            jQuery("#loading").hide()
            jQuery("#error").show()
            setTimeout ->
                jQuery("#error").hide()
            , 3000
    })

###
初期化
###
jQuery ->
    jQuery("#submit").click getNotes

