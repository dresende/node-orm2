
var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;',
  "/": '&#x2F;'
};

function escapeHtml(string) {
  return String(string).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
}

$(document).ready(function () {
  var $alerts         = $('#main .alerts');
  var $texts          = $('#main section.latest .texts');
  var $newMessageForm = $('#main section.new form');

  function showAlert(type, content) {
    $alerts.hide(100, function () {
      $alerts.html(
        '<div class=' + type + '>' + content + '</div>'
      ).show(250);
    });
  }

  function renderComment(com) {
    var html = '';
    html += '<div class="comment">';
    html +=   '<div class="meta">' + com.createdAt + '</div>';
    html +=   '<p>' + escapeHtml(com.body) + '</p>';
    html += '</div>';
    return html;
  }

  function renderComments(comments) {
    var html = '';
    html += '<div class="comments">';
    html +=   '<h4>Comments</h4>';

    for (var a = 0; a < comments.length; a++) {
      html += renderComment(comments[a]);
    }
    html +=   '<div class="new-comment">';
    html +=     '<form>';
    html +=       '<div class="entry body"><label>';
    html +=         '<textarea name="body" placeholder="Add comment:" />';
    html +=       '</label></div>';
    html +=       '<button type="submit">Add</button>';
    html +=     '</form>';
    html +=   '</div>';
    html += '</div>';
    return html;
  }

  function renderMessage(msg) {
    var html = '';
    html += '<div class="message" data-id="' + msg.id + '">'
    html +=   '<div class="meta">' + msg.createdAt + '</div>';
    html +=   '<h4>' + escapeHtml(msg.title) + '</h4>';
    html +=   '<p>'  + escapeHtml(msg.body).replace(/\n/g, '<br/>')  + '</p>';
    html +=   renderComments(msg.comments);
    html += '</div>'
    return html;
  }

  function renderErrors(errors) {
    var key, value;
    var html = '';

    html += '<ul class="field-errors">';
    for (key in errors) {
      value = errors[key];
      html += '<li>' + key + ': ' + value.join(', ') + '</li>';
    }
    html += '</ul>';

    return html;
  }

  function enhanceMessage($msg) {
    $msg.find('.comments .new-comment form').submit(function (e) {
      var $form = $(e.target);
      var $msg  = $form.parents('.message:first');
      var msgId = $msg.data('id')

      e.preventDefault();

      $.ajax({
        url    : '/message/' + msgId + '/comments',
        method : 'post',
        data   : $form.serialize()
      }).done(function (data) {
        if ('errors' in data) {
          showAlert(
            "error",
            "Errors occurred whilst adding comment" +
            renderErrors(data.errors)
          );
        } else {
          $(renderComment(data)).insertBefore($msg.find('.new-comment'));
          showAlert("info", "Comment saved!");
        }
        $form[0].reset();
      }).fail(function (xhr, err, status) {
        showAlert('error', xhr.status + ', ' + xhr.responseText);
      });
    });
  }

  function loadMessages() {
    $.ajax({
      url: '/messages'
    }).done(function (data) {
      var html = '';
      for (var a = 0; a < data.items.length; a++) {
        html += renderMessage(data.items[a]);
      }
      $texts.html(html);
      $texts.find('.message').each(function (i, msg) {
        enhanceMessage($(msg));
      });
    }).fail(function (xhr, err, status) {
      showAlert('error', xhr.status + ', ' + xhr.responseText);
    });
  }

  $newMessageForm.submit(function (e) {
    e.preventDefault();

    $.ajax({
      url    : $newMessageForm.attr('action'),
      method : 'post',
      data   : $newMessageForm.serialize()
    }).done(function (data) {
      var $msg;

      if ('errors' in data) {
        showAlert(
          "error",
          "Errors occurred whilst saving" +
          renderErrors(data.errors)
        );
      } else {
        $msg = $($.parseHTML(renderMessage(data)));
        $texts.prepend($msg);
        enhanceMessage($msg);

        showAlert("info", "TeXT saved!");
      }
      $newMessageForm[0].reset();
    }).fail(function (xhr, err, status) {
      showAlert('error', xhr.status + ', ' + xhr.responseText);
    });
  });

  loadMessages();
});

