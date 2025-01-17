//var searchResultFormat = '<tr><td>$name</td><td>$description</td><td><a href="$link" target="_blank">YouTube</a></td></tr>';
var searchResultFormat = '<tr><td>$name</td><td align="left">$description</td><td align="left">$solution</td><td align="left">$link</td></tr>';
var linkTemplate = 'https://youtube.com/watch?v=$video&t=$time';
var linkTemplateAcademy = 'https://academy.hackthebox.eu/module/details/$course';
var totalLimit = 250;
var replaceStrings = ['HackTheBox - ', 'VulnHub - ', 'UHC - '];

var controls = {
    oldColor: '',
    displayResults: function () {
        if (results.style) {
            results.style.display = '';
        }
        resultsTableHideable.classList.remove('hide');
    },
    hideResults: function () {
        if (results.style) {
            results.style.display = 'none';
        }
        resultsTableHideable.classList.add('hide');
    },
    doSearch: function (match, dataset) {
        results = [];

        words = match.toLowerCase();
        words = words.split(' ');
        regex = '';
        posmatch = [];
        negmatch = [];
        // Lazy way to create regex (?=.*word1)(?=.*word2) this matches all words.
        for (i = 0; i < words.length; i++) {
            if (words[i][0] != '-') {
                posmatch.push(words[i]);
                regex += '(?=.*' + words[i] + ')';
            } else {
                negmatch.push(words[i].substring(1));
                //regex += '(^((?!' + words[i].substring(1) + ').)*$)';
            }
        }
        if (negmatch.length > 0) {
            regex += '(^((?!('; // + words[i].substring(1) + ').)*$)';
            for (i = 0; i < negmatch.length; i++) {
                regex += negmatch[i];
                if (i != negmatch.length - 1) {
                    regex += '|';
                }
            }
            regex += ')).)*$)';
        }

        dataset.forEach(e => {
            for (i = 0; i < replaceStrings.length; i++) {
                e.name = e.name.replace(replaceStrings[i], '');
            }

            if ((e.description + e.name + e.tag).toLowerCase().match(regex)) results.push(e);
            //if (e.description.toLowerCase().match(regex) || e.name.toLowerCase().match(regex) || e.tag.toLowerCase().match(regex)) results.push(e);
        });
        return results;
    },
    updateResults: function (loc, results) {
        if (results.length == 0) {
            noResults.style.display = '';
            noResults.textContent = 'No Results Found';

            resultsTableHideable.classList.add('hide');
        } else if (results.length > totalLimit) {
            noResults.style.display = '';
            resultsTableHideable.classList.add('hide');
            noResults.textContent = 'Error: ' + results.length + ' results were found, try being more specific';
            this.setColor(colorUpdate, 'too-many-results');
        } else {
            var tableRows = loc.getElementsByTagName('tr');
            for (var x = tableRows.length - 1; x >= 0; x--) {
                loc.removeChild(tableRows[x]);
            }

            noResults.style.display = 'none';
            resultsTableHideable.classList.remove('hide');

            results.forEach(r => {
                //Not the fastest but it makes for easier to read code :>
                // console.log("🚀 ~ file: logic.js ~ description 104 ~ r", r)

                if (r.academy) {
                    el = searchResultFormat
                        .replace('$name', r.name)
                        .replace('$description', r.description)
                        .replace('$link', linkTemplateAcademy.replace('$course', r.academy))
                        .replace('$solution', 'xxx');

                } else {
                    //formatting Solution(s)
                    var tmpSolution = '<p>$count. $solution</p>';
                    var finalSolution = '';
                    var count = 0
                    r.solution.forEach(s => {
                        count += 1
                        var tmp = tmpSolution
                            .replace('$solution', s)
                            .replace('$count', count)
                        finalSolution += tmp
                    })
                    //formatting link(s)
                    var tmpLink = '<p>$count. <a href="$href">$link</a></p>';
                    var finalLink = '';
                    var count = 0
                    r.link.forEach(l => {
                        count += 1
                        var tmp = tmpLink
                            .replace('$href', l)
                            .replace('$link', l)
                            .replace('$count', count)
                        finalLink += tmp
                    })

                    el = searchResultFormat
                        .replace('$name', r.name)
                        .replace('$description', r.description)
                        // .replace('$link', linkTemplate.replace('$video', r.videoId).replace('$time', timeInSeconds))
                        .replace('$solution', finalSolution)
                        .replace('$link', finalLink);
                };
                // console.log("🚀 ~ file: logic.js ~ description 97 ~ el", el)

                var wrapper = document.createElement('table');
                wrapper.innerHTML = el;
                var div = wrapper.querySelector('tr');
                // console.log("🚀 ~ file: logic.js ~ description 102 ~ div", div)
                loc.appendChild(div);
            });
        }
    },
    setColor: function (loc, indicator) {
        if (this.oldColor == indicator) return;
        var colorTestRegex = /^color-/i;

        loc.classList.forEach(cls => {
            //we cant use class so we use cls instead :>
            if (cls.match(colorTestRegex)) loc.classList.remove(cls);
        });
        loc.classList.add('color-' + indicator);
        this.oldColor = indicator;
    }
};
window.controls = controls;

document.addEventListener('DOMContentLoaded', function () {
    results = document.querySelector('div.results');
    searchValue = document.querySelector('input.search');
    form = document.querySelector('form.searchForm');
    resultsTableHideable = document.getElementsByClassName('results-table').item(0);
    resultsTable = document.querySelector('tbody.results');
    resultsTable = document.querySelector('tbody.results');
    noResults = document.querySelector('div.noResults');
    colorUpdate = document.body;

    // Preventing initial fade
    document.body.classList.add('fade');

    var currentSet = [];
    var oldSearchValue = '';

    function doSearch(event) {
        var val = searchValue.value;

        if (val != '') {
            controls.displayResults();
            currentSet = window.dataset;
            oldSearchValue = val;

            currentSet = window.controls.doSearch(val, currentSet);
            if (currentSet.length < totalLimit) window.controls.setColor(colorUpdate, currentSet.length == 0 ? 'no-results' : 'results-found');

            window.controls.updateResults(resultsTable, currentSet);
        } else {
            controls.hideResults();
            window.controls.setColor(colorUpdate, 'no-search');
            noResults.style.display = 'none';
            currentSet = window.dataset;
        }

        if (event.type == 'submit') event.preventDefault();
    }

    fetch('./db.json')
        .then(res => res.json())
        .then(data => {
            window.dataset = data;
            currentSet = window.dataset;
            window.controls.updateResults(resultsTable, window.dataset);
            doSearch({
                type: 'none'
            });
        });

    form.submit(doSearch);

    searchValue.addEventListener('input', doSearch);
});