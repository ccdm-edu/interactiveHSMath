'use strict'

// Replacing $(function() { ... }) with native standard DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

  // need to not have every css load on every page, when that is fixed, can get rid of this
  let targetLinks = document.querySelectorAll('a[href="#AdvancedTopics"]');
  targetLinks.forEach(el => {
    el.style.display = 'none';
  });

  // Dont want a next button on this page so kill it here. Once at end of a topic, time to pick a new topic and that can't be my choice
  let $nextBtn = document.getElementById("GoToNextPage");
  if ($nextBtn) $nextBtn.style.display = 'none';

  let $prevBtn = document.getElementById("GoToPreviousPage");
  if ($prevBtn) {
    let wrapper = document.createElement('a');
    wrapper.href = "../MusicNotesTrig";
    $prevBtn.parentNode.insertBefore(wrapper, $prevBtn);
    wrapper.appendChild($prevBtn);
  }

});
