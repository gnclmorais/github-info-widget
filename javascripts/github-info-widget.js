/**
 * Github Repository Info Widget
 * JQuery plugin to create a GitHub widget of the provided repository
 */
(function($) {
  $.fn.githubInfo = function (options) {
    var wrapper = $(this)
      , settings = $.extend({
          // Repository info
          'username': 'jquery',
          'repository': 'jquery',
          // Sparkline options
          'timespan': 30,
          // Optional data
          'showDates': false,
          'tinyAvatars': false
        }, settings);

    /** Format a given Date element to YYYY.MM.DD string format */
    function dateFormatter(d) {
      var day   = d.getDate()
        , month = d.getMonth()
        , year  = d.getFullYear();

      return year + '.' + (month > 9 ? '' : '0') + month + '.' + (day > 9 ? '' : '0') + day;
    }

    /**
     * Calculates a human readable time span between two given dates
     * E.g.: '3 months ago'
     */
    function dateDiff(a, b) {
      var dateA = {
            minutes: a.getMinutes(),
            hours:   a.getHours(),
            day:     a.getDate(),
            month:   a.getMonth(),
            year:    a.getFullYear()
          }
        , dateB = {
            minutes: b.getMinutes(),
            hours:   b.getHours(),
            day:     b.getDate(),
            month:   b.getMonth(),
            year:    b.getFullYear()
          }
        , diff = {};

      diff.minutes = Math.max(dateB.minutes - dateA.minutes, 0);
      diff.hours   = Math.max(dateB.hours - dateA.hours, 0);
      diff.day     = Math.max(dateB.day - dateA.day, 0);
      diff.month   = Math.max(Math.abs(dateB.month - dateA.month), 0);
      diff.year    = Math.max(Math.abs(dateB.year - dateA.year), 0);

      diff.value = diff.year || diff.month || diff.day || diff.hours || diff.minutes;
      diff.unit = diff.year && 'year' ||
        diff.month && 'month' ||
        diff.day && 'day' ||
        diff.hours && 'hour' ||
        diff.minutes && 'minute';

      return diff.value + ' ' + diff.unit + (diff.value > 1 ? 's' : '') +' ago';
    }

    return this.each(function() {
      /** Request data from the repository */
      $.ajax({
        type: 'GET',
        url: 'https://api.github.com/repos/' + settings.username + '/' + settings.repository,
        dataType: 'json',
        success: function(data) {
          /** Create and append header */
          wrapper.append('<div class="title"><a class="site-logo" href="https://github.com/"><img alt="GitHub" class="github-logo-4x" height="30" src="https://a248.e.akamai.net/assets.github.com/images/modules/header/logov7@4x.png"></a><span> / ' + data.name + '</span></div>');

          /** Create and append short description */
          wrapper.append('<div class="summary">' +
            '<p class="description">' + data.description + '</p>' +
            '<a class="homepage" href="' + data.homepage + '">' + data.homepage + '</a>' +
            '</div>');

          /** Ownership, Views, and Forks info */
          wrapper.append('<div class="stats">' +
            '<div class="ownership">' +
            '<img class="gravatar" src="' + data.owner.avatar_url + '" />' +
            '<a class="link-user" href="https://github.com/' + data.owner.login + '">' + data.owner.login + '</a>' +
            '</div>' +
            '<div class="repostats">' +
            '<ul class="repo-stats">' +
            '<li class="watchers watching minibutton btn-watch"><a href="' + data.html_url + '/watchers" class="tooltipped downwards" original-title="Watchers - You\'re Watching">' + '<span class="icon"></span>' + data.watchers + '</a></li>' +
            '<li class="forks minibutton btn-fork"><a href="' + data.html_url + '/network" class="tooltipped downwards" original-title="Forks - You have a fork">' + '<span class="icon"></span>' + data.forks + '</a></li>' +
            '</ul>' +
            '</div>' +
            '</div>');

          /** Create and append repo activity */
          var todaysDate = new Date()
            , createDate = new Date(data.created_at)
            , updateDate = new Date(data.pushed_at)
            , createdAgo = dateDiff(createDate, todaysDate)
            , updatedAgo = dateDiff(updateDate, todaysDate)
            , updatedPar = '<p class="updated"><span class="emphasis">Updated</span>'
            , createdPar = '<p class="created"><span class="emphasis">Created</span>';

          if (settings.showDates) {
            updatedPar += dateFormatter(updateDate) +
              '<span class="time-ago">(' + updatedAgo + ')</span>' +
              '</p>';

            createdPar += dateFormatter(createDate) +
              '<span class="time-ago">(' + createdAgo + ')</span>' +
              '</p>';
          } else {
            updatedPar += updatedAgo + '</p>';

            createdPar += createdAgo + '</p>';
          }

          wrapper.append('<div class="activity">' +
            '<p class="history">' +
            '<span class="emphasis">Commit history</span><span class="sparkline"></span>' +
            '</p>' +
            updatedPar +
            createdPar +
            '</div>');

          /** Request repo's commits */
          $.ajax({
            type: 'GET',
            url: 'https://api.github.com/repos/' + settings.username + '/' + settings.repository + '/commits',
            dataType: 'json',
            success: function(data) {
              var i = settings.timespan
                , commits = []
                , today = new XDate()
                , day
                , diff = 0;

              /** Initialize the array */
              while (i--) {
                commits[i] = 0;
              }

              /** Check dates */
              i = 0;
              while (diff < settings.timespan && data[i]) {
                day = new XDate(data[i++].commit.committer.date);

                diff = Math.floor(day.diffDays(today));

                if (diff < settings.timespan) commits[diff] += 1;
              }

              /** Reverse commits order (oldest to newest) and present sparkline */
              $('.sparkline').sparkline(commits.reverse(), {
                type: 'bar',
                barColor: 'grey',
                barWidth: 2
              });

              /** Latest commits */
              var divLatestCommits = '<div class="lastest-commits"><h4>Latest Commits</h4><div class="wrapper">'
                , length = data.length;

              today = new Date();

              for (i = 0; i < length; i++) {
                divLatestCommits += '<div class="commit ' + (i % 2 ? 'even' : 'odd') + '">' +
                  '<div class="commiter-info">' +
                  '<img class="gravatar' + (settings.tinyAvatars ? ' tiny' : '') + '" src="' + data[i].committer.avatar_url + '" />' +
                  '<a class="link-user" href="https://github.com/' + data[i].committer.login + '">' + data[i].committer.login + '</a> ' +
                  '<span class="time-ago">(' + dateDiff(new Date(data[i].commit.author.date), today) + ')</span>' +
                  '</div>' +
                  '<p class="commit-msg">' + data[i].commit.message.replace(/\n{2,}/g, '<br/>') + '</p>' +
                  '</div>';
              }
              divLatestCommits += '</div></div>';

              wrapper.append(divLatestCommits);
            }
          });
        }
      });
    });
  };
})(jQuery);