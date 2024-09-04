[x] dialog template development
[x] state, info, confirm dialog box development
[x] profile, language dialog box development
[x] form template development (state management)
[x] form dirty blocker
[x] page router 
[-] router redirect base on login state

[x] popover tool tip  
[x] sort by column header click on table list 
[ ] load country code, currency code and etc
[ ] error message display on app.js loading stage
[ ] toast box

--------------------------------------

<button popovertarget="mypopover">Toggle the popover</button>
<div id="mypopover"  popover="manual">
  <h1>Popover content</h1>
  <button popovertarget="mypopover" popovertargetaction="hide">
    Hide popover
  </button>
</div>

var popover = document.getElementById('mypopover');
  popover.showPopover();
  setTimeout(() => {
    popover.hidePopover();
  }, 4000);



[popover] {
  position: fixed;
  inset: 0;
  width: fit-content;
  height: fit-content;
  margin: auto;
  border: solid;
  padding: 0.25em;
  overflow: auto;
  color: CanvasText;
  background-color: Canvas;
}


::backdrop {
  backdrop-filter: blur(3px);
}


:popover-open {
  width: 200px;
  height: 100px;
  position: absolute;
  inset: unset;
  bottom: 5px;
  right: 5px;
  margin: 0;
}
