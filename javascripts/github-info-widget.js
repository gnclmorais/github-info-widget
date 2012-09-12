/**
 * Github Repository Info Widget
 * JQuery plugin to create a GitHub widget of the provided repository
 */
(function($) {
    $.fn.githubInfo = function (options) {
        var wrapper = $(this),
            settings = $.extend({
                // Repository info
                'username': 'jquery',
                'repository': 'jquery',
                // Sparkline options
                'timespan': 30, // in days
                // Optional data
                'showDates': false,
                'tinyAvatars': false
            }, settings);

        /** Format a given Date element to YYYY.MM.DD string format */
        function dateFormatter(d) {
            var day   = d.getDate(),
                month = d.getMonth(),
                year  = d.getFullYear();

            return year + '.' + (month > 9 ? '' : '0') + month + '.' + (day > 9 ? '' : '0') + day;
        }

        /**
         * Calculates a human readable time span between two given dates
         * E.g.: '3 months ago'
         */
        function dateDiff(a, b) {
            var dateA = {
                    seconds: a.getSeconds(),
                    minutes: a.getMinutes(),
                    hours:   a.getHours(),
                    day:     a.getDate(),
                    month:   a.getMonth(),
                    year:    a.getFullYear()
                },
                dateB = {
                    seconds: b.getSeconds(),
                    minutes: b.getMinutes(),
                    hours:   b.getHours(),
                    day:     b.getDate(),
                    month:   b.getMonth(),
                    year:    b.getFullYear()
                },
                diff  = {},
                week  = 7,
                month = 30,
                year  = 365;

            diff.days = dayNumber(b) - dayNumber(a);
            if (diff.days > 0) {
                diff.years  = Math.floor(diff.days / year);
                diff.months = Math.floor(diff.days / month);
                diff.weeks  = Math.floor(diff.days / week);

                diff.total = diff.years || diff.months || diff.weeks || diff.days;
                diff.unit  = diff.years && 'year' ||
                    diff.months && 'month' ||
                    diff.weeks && 'week' ||
                    diff.days && 'day';
            } else {
                diff.seconds = dateB.seconds - dateA.seconds;
                diff.minutes = dateB.minutes - dateA.minutes;
                diff.hours   = dateB.hours - dateA.hours;

                diff.total = diff.hours || diff.minutes || diff.seconds;
                diff.unit  = diff.hours && 'hour' || diff.minutes && 'minute' || diff.seconds && 'second';
            }

            return diff.total + ' ' + diff.unit + (diff.total > 1 ? 's' : '') +' ago';
        }

        function dayNumber(date) {
            var y = date.getFullYear(),
                m = date.getMonth(),
                d = date.getDate();

            // Algorithm here: http://alcor.concordia.ca/~gpkatch/gdate-algorithm.html
            m = (m + 9) % 12;
            y = y - m / 10;
            return 365 * y + y / 4 -  y / 100 +  y / 400 + (m * 306 + 5) / 10 + (d - 1);
        }

        return this.each(function() {
            /** Request data from the repository */
            $.ajax({
                type: 'GET',
                url: 'https://api.github.com/repos/' + settings.username + '/' + settings.repository,
                dataType: 'jsonp',
                success: function (data) {
                    /** Handles GitHub API JSON-P callback result */
                    data = data.data || data;

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
                    var todaysDate = new Date(),
                        createDate = new Date(data.created_at),
                        updateDate = new Date(data.pushed_at),
                        createdAgo = dateDiff(createDate, todaysDate),
                        updatedAgo = dateDiff(updateDate, todaysDate),
                        updatedPar = '<p class="updated"><span class="emphasis">Updated</span>',
                        createdPar = '<p class="created"><span class="emphasis">Created</span>';

                    if (settings.showDates) {
                        updatedPar += dateFormatter(updateDate) + '<span class="time-ago">(' + updatedAgo + ')</span>';
                        createdPar += dateFormatter(createDate) + '<span class="time-ago">(' + createdAgo + ')</span>';
                    }
                    updatedPar += updatedAgo + '</p>';
                    createdPar += createdAgo + '</p>';

                    wrapper.append('<div class="activity">' +
                        '<p class="history">' +
                        '<span class="emphasis">Commit history</span><span class="sparkline"></span>' +
                        '</p>' +
                        updatedPar +
                        createdPar +
                        '</div>');
                }
            });

            /** Request repo's commits */
            $.ajax({
                type: 'GET',
                url: 'https://api.github.com/repos/' + settings.username + '/' + settings.repository + '/commits',
                dataType: 'jsonp',
                success: function (data) {
                    /** Handles GitHub API JSON-P callback result */
                    data = data.data || data;

                    var today = new Date(),
                        commits = [],
                        diff = 0,
                        day,
                        i;

                    /** Initialize the array */
                    i = settings.timespan;
                    while (i--) {
                        commits[i] = 0;
                    }

                    /** Check dates */
                    i = 0;
                    while (diff < settings.timespan && data[i]) {
                        day = new Date(data[i++].commit.committer.date);

                        diff = dayNumber(today) - dayNumber(day);
                        if (diff < settings.timespan) {
                            commits[diff] += 1;
                        }
                    }

                    /** Reverse commits order (oldest to newest) and present sparkline */
                    $('.sparkline').sparkline(commits.reverse(), {
                        type: 'bar',
                        barColor: 'grey',
                        barWidth: 2
                    });

                    /** Latest commits */
                    var divLatestCommits = '<div class="latest-commits"><h4>Latest Commits</h4><div class="wrapper">',
                        length = data.length;

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
        });
    };
})(jQuery);