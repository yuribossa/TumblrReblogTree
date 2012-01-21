
/*
#   tumblr reblog tree visualize application
#   author:  yuribossa
#   contact: yuribossa@gmail.com
*/

/*
木構造をHTMLで表示
*/

(function() {
  var callback, getNotes, htmlToList, listToTree, printTree;

  printTree = function(tree) {
    var html, print;
    print = function(tr, html) {
      var node, _i, _len, _ref;
      html += "<ul>";
      html += "<li>" + tr.node.toUser;
      _ref = tr.leaf;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        html = print(node, html);
      }
      html += "</li>";
      return html += "</ul>";
    };
    html = print(tree, "");
    return jQuery("#result").append(html);
  };

  /*
  配列を木構造に変換
  */

  listToTree = function(list) {
    /*
        ルートノード取得
    */
    var flg, i, j, k, levelList, makeTree, node, reblogList, root, tree, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
    root = {};
    reblogList = [];
    for (i = 0, _ref = list.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
      if (list[i].postUser) {
        root = list[i];
      } else {
        reblogList.unshift(list[i]);
      }
    }
    /*
        配列を階層毎の配列に変換
    */
    node = root;
    levelList = [[root]];
    for (i = 0, _ref2 = reblogList.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
      flg = false;
      for (j = _ref3 = levelList.length - 1; _ref3 <= 0 ? j <= 0 : j >= 0; _ref3 <= 0 ? j++ : j--) {
        for (k = 0, _ref4 = levelList[j].length; 0 <= _ref4 ? k < _ref4 : k > _ref4; 0 <= _ref4 ? k++ : k--) {
          if (reblogList[i].fromUser === levelList[j][k].toUser) {
            if (j === levelList.length - 1) {
              levelList.push([reblogList[i]]);
            } else {
              levelList[j + 1].push(reblogList[i]);
            }
            flg = true;
            break;
          }
        }
        if (flg) break;
      }
      if (!flg) {
        console.log("Not found reblog connection: " + reblogList[i].toUser + " reblogged from " + reblogList[i].fromUser);
      }
    }
    /*
        木構造にノード追加
    */
    makeTree = function(tree, node, level1, level2) {
      var i, res, _ref5;
      if (tree.node.toUser === node.fromUser && level1 + 1 === level2) {
        tree.leaf.push({
          node: node,
          leaf: []
        });
        return true;
      } else {
        if (tree.leaf.length) {
          for (i = 0, _ref5 = tree.leaf.length; 0 <= _ref5 ? i < _ref5 : i > _ref5; 0 <= _ref5 ? i++ : i--) {
            res = makeTree(tree.leaf[i], node, level1 + 1, level2);
            if (res) return true;
          }
        }
      }
      return false;
    };
    tree = {
      node: levelList[0][0],
      leaf: []
    };
    for (i = 1, _ref5 = levelList.length; 1 <= _ref5 ? i < _ref5 : i > _ref5; 1 <= _ref5 ? i++ : i--) {
      for (j = 0, _ref6 = levelList[i].length; 0 <= _ref6 ? j < _ref6 : j > _ref6; 0 <= _ref6 ? j++ : j--) {
        makeTree(tree, levelList[i][j], 0, i);
      }
    }
    return tree;
  };

  /*
  サーバから届いたデータを配列に変換
  */

  htmlToList = function(data) {
    var info, likesInfo, matchObj, notesInfo, obj;
    notesInfo = [];
    likesInfo = [];
    while (true) {
      info = (data.match(/(<li.+?<\/li>)/) || [])[1] || null;
      if (!info) break;
      data = RegExp.rightContext;
      /*
              Reblogの情報かチェック
      */
      if (/<li class=" note reblog.+>.+?<\/li>/.test(info)) {
        matchObj = info.match(/^<li.+?<a href="(http:\/\/.+?)".+?title="(.+?)".+?img src="(http:\/\/.+?)".*?><\/a>.+?<a.+?>(.+?)<\/a>.+?reblogged.+?<a href="(http:\/\/.+?)".+?title="(.+?)".*?>(.+?)<\/a>.+?<\/li>\s*$/);
        if (matchObj) {
          if (!matchObj[4]) console.log(matchObj);
          obj = {
            toUrl: matchObj[1],
            toTitle: matchObj[2],
            toAvatar: matchObj[3],
            toUser: matchObj[4],
            fromUrl: matchObj[5],
            fromTitle: matchObj[6],
            fromUser: matchObj[7]
          };
        } else {
          /*
                          オリジナルポストかチェック
          */
          matchObj = info.match(/^<li.+?<a href="(http:\/\/.+?)".+?title="(.+?)".+?img src="(http:\/\/.+?)".*?><\/a>.+?<a href="(http:\/\/.+?)".+?title="(.+?)".*?>(.+?)<\/a>.+?posted this.+?<\/li>\s*$/);
          if (matchObj) {
            obj = {
              postUrl: matchObj[1],
              postTitle: matchObj[2],
              postAvatar: matchObj[3],
              postUser: matchObj[6],
              toUrl: matchObj[1],
              toTitle: matchObj[2],
              toAvatar: matchObj[3],
              toUser: matchObj[6]
            };
          }
        }
        notesInfo.push(obj);
      } else {
        likesInfo.push(info);
      }
    }
    return notesInfo;
  };

  /*
  Submitボタン押下時のAjaxのCallback
  */

  callback = function(data) {
    var list, tree;
    data = data.replace(/[\r\n]/g, "");
    data = data.replace(/\s+/g, " ");
    list = htmlToList(data);
    tree = listToTree(list);
    jQuery("#loading").hide();
    return printTree(tree);
  };

  /*
  Submitボタン押下時のAjax
  */

  getNotes = function() {
    var url;
    url = jQuery("#inputUrl").val();
    jQuery("#inputUrl").val("");
    jQuery("#result").empty();
    jQuery("#loading").show();
    return jQuery.ajax({
      url: "/getnotes",
      type: "POST",
      data: {
        url: url
      },
      success: callback,
      error: function(req, textStatus, errorThrown) {
        jQuery("#loading").hide();
        jQuery("#error").show();
        return setTimeout(function() {
          return jQuery("#error").hide();
        }, 3000);
      }
    });
  };

  /*
  初期化
  */

  jQuery(function() {
    return jQuery("#submit").click(getNotes);
  });

}).call(this);
