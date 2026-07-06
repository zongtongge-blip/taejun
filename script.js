(function () {
  var asOf = "2026-07-06";
  var filter = "전체";
  var events = [
    { start: "2026-06-09", end: "2026-06-15", title: "기말고사" },
    { start: "2026-06-16", end: "2026-06-22", title: "보강기간" },
    { start: "2026-06-22", end: "2026-07-03", title: "재입학 신청기간" },
    { start: "2026-06-23", end: "2026-07-06", title: "하계 계절학기" },
    { start: "2026-06-23", end: "2026-08-31", title: "미등록 휴학기간" },
    { start: "2026-06-23", end: "2026-06-23", title: "하계방학" },
    { start: "2026-06-25", end: "2026-06-30", title: "성적공시 및 정정" },
    { start: "2026-07-13", end: "2026-08-31", title: "휴학연기 신청기간" },
    { start: "2026-07-13", end: "2026-07-17", title: "복학기간" },
    { start: "2026-07-29", end: "2026-07-31", title: "예비수강 신청기간" }
  ];

  function parseDate(value) {
    var parts = value.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function dayCount(start, end) {
    var msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((parseDate(end) - parseDate(start)) / msPerDay) + 1;
  }

  function daysUntil(value) {
    var msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((parseDate(value) - parseDate(asOf)) / msPerDay);
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
      weekday: "short"
    }).format(parseDate(value));
  }

  function formatRange(event) {
    return event.start === event.end
      ? formatDate(event.start)
      : formatDate(event.start) + " - " + formatDate(event.end);
  }

  function getStatus(event) {
    if (event.end < asOf) {
      return "완료";
    }
    if (event.start > asOf) {
      return "예정";
    }
    return "진행 중";
  }

  function statusClass(status) {
    if (status === "진행 중") {
      return "active";
    }
    if (status === "예정") {
      return "upcoming";
    }
    return "done";
  }

  function splitDaysByMonth(event) {
    var result = {};
    var cursor = parseDate(event.start);
    var last = parseDate(event.end);

    while (cursor <= last) {
      var key = cursor.getMonth() + 1 + "월";
      result[key] = (result[key] || 0) + 1;
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  function createElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (text !== undefined) {
      element.textContent = text;
    }
    return element;
  }

  function statusBadge(status) {
    return '<span class="status ' + statusClass(status) + '">' + status + "</span>";
  }

  var enrichedEvents = events
    .slice()
    .sort(function (a, b) {
      return a.start.localeCompare(b.start);
    })
    .map(function (event) {
      return {
        start: event.start,
        end: event.end,
        title: event.title,
        status: getStatus(event),
        duration: dayCount(event.start, event.end)
      };
    });

  var activeEvents = enrichedEvents.filter(function (event) {
    return event.status === "진행 중";
  });
  var upcomingEvents = enrichedEvents.filter(function (event) {
    return event.status === "예정";
  });
  var completedEvents = enrichedEvents.filter(function (event) {
    return event.status === "완료";
  });
  var monthLabels = ["6월", "7월", "8월"];
  var minDate = parseDate(enrichedEvents[0].start).getTime();
  var maxDate = Math.max.apply(null, enrichedEvents.map(function (event) {
    return parseDate(event.end).getTime();
  }));
  var totalTimelineDays = Math.max(1, (maxDate - minDate) / (24 * 60 * 60 * 1000) + 1);

  function renderSummary() {
    var summary = document.getElementById("summary-grid");
    var longest = Math.max.apply(null, enrichedEvents.map(function (event) {
      return event.duration;
    }));
    var cards = [
      { label: "진행 중", value: activeEvents.length, tone: "success" },
      { label: "예정", value: upcomingEvents.length, tone: "info" },
      { label: "완료", value: completedEvents.length, tone: "warning" },
      { label: "가장 긴 일정", value: longest + "일", tone: "" }
    ];

    summary.innerHTML = cards.map(function (card) {
      return '<article class="stat-card ' + card.tone + '"><span>' + card.label + "</span><strong>" + card.value + "</strong></article>";
    }).join("");
  }

  function renderActiveEvents() {
    var target = document.getElementById("active-events");
    var nextEvent = upcomingEvents[0];
    var html = activeEvents.map(function (event) {
      return [
        '<article class="event-card">',
        "<div><h3>" + event.title + "</h3><p>" + formatRange(event) + " · 총 " + event.duration + "일</p></div>",
        '<span class="pill active">진행 중</span>',
        "</article>"
      ].join("");
    }).join("");

    if (nextEvent) {
      html += '<p class="next-event">다음 일정은 <strong>' + nextEvent.title + "</strong>이며, " + daysUntil(nextEvent.start) + "일 후 시작됩니다.</p>";
    }

    target.innerHTML = html;
  }

  function renderLongEvents() {
    var target = document.getElementById("long-events");
    target.innerHTML = enrichedEvents
      .slice()
      .sort(function (a, b) {
        return b.duration - a.duration;
      })
      .slice(0, 4)
      .map(function (event) {
        return [
          '<div class="list-row">',
          "<div><strong>" + event.title + "</strong><span>" + formatRange(event) + "</span></div>",
          '<span class="pill">' + event.duration + "일</span>",
          "</div>"
        ].join("");
      })
      .join("");
  }

  function renderMonthChart() {
    var target = document.getElementById("month-chart");
    var counts = monthLabels.map(function (month) {
      return enrichedEvents.reduce(function (total, event) {
        return total + (splitDaysByMonth(event)[month] || 0);
      }, 0);
    });
    var max = Math.max.apply(null, counts);

    target.innerHTML = monthLabels.map(function (month, index) {
      var value = counts[index];
      var width = Math.max(4, Math.round((value / max) * 100));
      return [
        '<div class="bar-row">',
        "<strong>" + month + "</strong>",
        '<div class="bar-track"><div class="bar-fill" style="width: ' + width + '%"></div></div>',
        '<span class="bar-value">' + value + "일</span>",
        "</div>"
      ].join("");
    }).join("");
  }

  function renderTimeline() {
    var target = document.getElementById("timeline");
    target.innerHTML = enrichedEvents.map(function (event) {
      var startOffset = (parseDate(event.start).getTime() - minDate) / (24 * 60 * 60 * 1000);
      var left = (startOffset / totalTimelineDays) * 100;
      var width = Math.max((event.duration / totalTimelineDays) * 100, 1.8);
      var active = event.status === "진행 중" ? " active" : "";

      return [
        '<div class="timeline-row">',
        '<div class="timeline-label"><strong>' + event.title + "</strong><span>" + formatRange(event) + "</span></div>",
        '<div class="timeline-track"><div class="timeline-bar' + active + '" style="left: ' + left.toFixed(2) + "%; width: " + width.toFixed(2) + '%"></div></div>',
        '<span class="duration">' + event.duration + "일</span>",
        "</div>"
      ].join("");
    }).join("");
  }

  function renderFilters() {
    var target = document.getElementById("filters");
    var options = ["전체", "진행 중", "예정", "완료"];
    target.innerHTML = "";

    options.forEach(function (option) {
      var button = createElement("button", "filter-btn" + (filter === option ? " active" : ""), option);
      button.type = "button";
      button.addEventListener("click", function () {
        filter = option;
        renderFilters();
        renderTable();
      });
      target.appendChild(button);
    });
  }

  function renderTable() {
    var target = document.getElementById("schedule-body");
    var visibleEvents = filter === "전체"
      ? enrichedEvents
      : enrichedEvents.filter(function (event) {
        return event.status === filter;
      });

    target.innerHTML = visibleEvents.map(function (event) {
      return [
        "<tr>",
        "<td><strong>" + event.title + "</strong></td>",
        "<td>" + formatRange(event) + "</td>",
        "<td>" + event.duration + "일</td>",
        "<td>" + statusBadge(event.status) + "</td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function init() {
    document.getElementById("today-label").textContent = formatDate(asOf);
    renderSummary();
    renderActiveEvents();
    renderLongEvents();
    renderMonthChart();
    renderTimeline();
    renderFilters();
    renderTable();
  }

  init();
})();
