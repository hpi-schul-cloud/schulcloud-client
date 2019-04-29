document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelectorAll('.tabContainer').length && document.querySelectorAll('.sectionsContainer').length) {
    var activeTab = document.querySelector('.tabContainer').querySelector('.tabs .tab:first-child');
    var activeSection = document.querySelector('.sectionsContainer').querySelector('.sections .section:first-child');
    activeTab.classList.add('active');
    activeSection.classList.add('active');
  }

  app.tabs.initialize();
}, false);

var app = {
  tabs: {
    initialize: function() {
      if (document.querySelectorAll('.tabContainer').length) {
        var container = document.querySelectorAll('.tabContainer');

        for (var i = 0, l = container.length; i < l; i++) {
          app.tabs.contain.call(null, container[i]);
          app.tabs.setIndicatorWidth.call(null, container[i]);

          var tabs = container[i].querySelectorAll('.tabs .tab');

          for (var ii = 0, ll = tabs.length; ii < ll; ii++) {
            tabs[ii].addEventListener('click', function() {
              app.tabs.setActiveTab.call(this);
            }, false);
            tabs[ii].addEventListener('mousedown', function(event) {
              event.preventDefault();
            }, false);
          }
        }

        window.addEventListener('resize', function() {
          for (var i = 0, l = container.length; i < l; i++) {
            app.tabs.contain.call(null, container[i]);
            app.tabs.setIndicatorWidth.call(null, container[i]);
          }
        }, false);
      }
    },
    setIndicatorWidth: function(parent) {
      if (parent.querySelectorAll('.tabs div').length === 0) {
        parent.querySelector('.tabs').appendChild(document.createElement('div'));
        parent.querySelector('.tabs div').classList.add('indicator');
      }

      var indicator = parent.querySelector('.tabs .indicator');
      var containerRect = parent.querySelector('.tabs').getBoundingClientRect();
      var curTabRect = parent.querySelector('.tabs .tab.active').getBoundingClientRect();

      // left = left of active element minus left of parent container
      indicator.style.left = (curTabRect.left - containerRect.left) + 'px';
      // right = parent container width minus width of active element plus left of active element
      indicator.style.right = ((containerRect.left + containerRect.width) - (curTabRect.left + curTabRect.width)) + 'px';
    },
    setActiveTab: function() {
      var indicator = this.parentElement.querySelector('.indicator');
      var parent = this;
      var newTab = this;
      var newTabSelector = this.getAttribute('data-tab');
      var newSection = document.querySelector('.sectionsContainer .sections .section[data-section=' + newTabSelector + ']')
      var oldSection = document.querySelector('.sectionsContainer .sections .section.active');

      while (!parent.classList.contains('tabs')) {
        parent = parent.parentElement;
      }

      var oldTab = parent.querySelector('.tab.active');

      var parentRect = parent.getBoundingClientRect();
      var newTabRect = newTab.getBoundingClientRect();
      var indicatorRect = indicator.getBoundingClientRect();

      if (indicatorRect.left < newTabRect.left) {
        indicator.style.right = ((parentRect.left + parentRect.width) - (newTabRect.left + newTabRect.width)) + 'px';
        indicator.style.left = (newTabRect.left - parentRect.left) + 'px';
      } else {
        indicator.style.left = (newTabRect.left - parentRect.left) + 'px';
        indicator.style.right = ((parentRect.left + parentRect.width) - (newTabRect.left + newTabRect.width)) + 'px';
      }

      oldTab.classList.remove('active');
      oldSection.classList.remove('active');
      this.classList.add('active');
      newSection.classList.add('active');

    },
    contain: function(container) {

    }
  }
}
