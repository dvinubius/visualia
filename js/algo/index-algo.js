const CONFIG1 = {
  "particles": {
    "number": {
      "value": 350,
      "density": {
        "enable": true,
        "value_area": 800
      }
    },
    "color": {
      "value": "#001A57" // duke blue
    },
    "shape": {
      "type": "polygon",
      "stroke": {
        "width": 0,
        "color": "#101010"
      },
      "polygon": {
        "nb_sides": 4
      },
      "image": {
        "src": "img/github.svg",
        "width": 100,
        "height": 100
      }
    },
    "opacity": {
      "value": 0.4,
      "random": false,
      "anim": {
        "enable": false,
        "speed": 1,
        "opacity_min": 0.1,
        "sync": false
      }
    },
    "size": {
      "value": 3,
      "random": true,
      "anim": {
        "enable": false,
        "speed": 40,
        "size_min": 0.1,
        "sync": false
      }
    },
    "line_linked": {
      "enable": true,
      "distance": 120,
      "color": "#222222",
      "opacity": 0.05,
      "width": 1
    },
    "move": {
      "enable": false,
      "speed": 2,
      "direction": "none",
      "random": true,
      "straight": false,
      "out_mode": "out",
      "attract": {
        "enable": false,
        "rotateX": 600,
        "rotateY": 1200
      }
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": {
        "enable": false,
        "mode": "repulse"
      },
      "onclick": {
        "enable": false,
        "mode": "push"
      },
      "resize": true
    },
    "modes": {
      "grab": {
        "distance": 400,
        "line_linked": {
          "opacity": 1
        }
      },
      "bubble": {
        "distance": 400,
        "size": 40,
        "duration": 2,
        "opacity": 8,
        "speed": 3
      },
      "repulse": {
        "distance": 80
      },
      "push": {
        "particles_nb": 6
      },
      "remove": {
        "particles_nb": 2
      }
    }
  },
  "retina_detect": true,
  "config_demo": {
    "hide_card": false,
    "background_color": "#b61924",
    "background_image": "",
    "background_position": "50% 50%",
    "background_repeat": "no-repeat",
    "background_size": "cover"
  }
};
const CONFIG_GAME_OF_LIFE = {
  config: {
    tickTime: 17, 
    generateSome: true,
    snakeMode: true,
    gridSize: 70 
  }  
};
const CONFIG_ELIFE = {
  config: {
    autostart: false,
    tickTime: 60,
    scaleFactor: 1.5,
    useColor: true
  }
}


let parallaxDivs; // array of DOM element objects
let particlesDiv; // $ object
let paraFactor = -0.3; // use negative values starting from 0 (for no parallax at all)


let exhibits = []; // where all the specific project objects will be

// ------- STATE --------- //
// window resize and scroll events will trigger hold and go for the exhibit sections, but in a rebounce-fashion
let wannaGoTimeout = null;
let timeoutValue = 15;
let scrolled = false; // keeps track of scrolls since the last animationFrame


window.onload = function() {
  // particle animations initialization
  particlesJS('particles-js', CONFIG1);
  
  particlesDiv = $('#particles-js')[0];  // holding the canvas where particles are rendered  
  parallaxWrappers = $('.parallax-wrapper').toArray(); // all possible places where particlesDiv can be contained as child

  // project 1 init 
  let project1 = gameOfLifeJS('exhibit-content-1', CONFIG_GAME_OF_LIFE);
  // autostart off = for performance reasons (go only when on display - scrollhandled)
  exhibits.push(project1);
  
  let project2 = animator.animateWorld(elife.valleyEx2Author, 'exhibit-content-2', CONFIG_ELIFE);
  exhibits.push(project2);
  

  // listener for scrolling
  window.onscroll = handleScroll;
}

function handleScroll() {
  scrolled = true;
  // animate via Greensock
  animateScrollGreenSock();
}

// animate via greensock
function animateScrollGreenSock() {
  if (!scrolled) {
    // nothing to do, return
  } else {
    // something to do - hanlde the scroll changes
    scrolled = false;
    // HANDLE PARALLAX

    // get dom element of parallaxWrapper currently in view
    let toParallax = getParallaxSectionInView();

    if (toParallax) {
      // put particles canvas into the right wrapper after removing it from actual parent
      if (particlesDiv.parentNode) {
        particlesDiv.parentNode.removeChild(particlesDiv);
      }
      toParallax.appendChild(particlesDiv);

      // calculate the parallax displacement
      let scrolledIntoView = $(window).scrollTop() + $(window).height() - $(toParallax).offset().top;
      let displacement = scrolledIntoView*paraFactor;

      // use greensock to move particles div according to displacement   
      TweenMax.to(particlesDiv, .1, {
        y: displacement,
        overwrite: 'all'
      });
    } else { 
      // for performance reasons...
      if (particlesDiv.parentNode) {
        particlesDiv.parentNode.removeChild(particlesDiv);
      }
    }
  }


  // HANDLE EXHIBITS
  let toPresent = getExhibitInView(false);
  if (toPresent) {    
    if (wannaGoTimeout) {
      clearTimeout(wannaGoTimeout);      
    }
    wannaGoTimeout = setTimeout(toPresent.go.bind(toPresent, true), timeoutValue);
  } else {
    // stop all, making sure the last one running stops
    exhibits.forEach(p => p.hold(true));
    // clear any timeout
    clearTimeout(wannaGoTimeout);
  }
}

// find the parallaxWrapper that is currently in view (if any)
function getParallaxSectionInView() {
  let posTop = $(window).scrollTop();
  let windowHeight = $(window).height();

  for (let i=0; i<parallaxWrappers.length; i++) {
    let wrapperTop = $(parallaxWrappers[i]).offset().top;  // Y where the section begins
    let wrapperBottom = $(parallaxWrappers[i]).offset().top + parallaxWrappers[i].offsetHeight; // Y where the section ends
    if (posTop + window.innerHeight >= wrapperTop &&
        posTop < wrapperBottom) {
      // found what we wanted, exit with value
      return parallaxWrappers[i];
    }     
  }  
  // if none found
  return null;
}

/** 
 * Find the exhibit object that is currently in view (if any).
 * @param entirely: only return if exhibit is completely on screen. 
 *        if set to false, exhibit will be returned if it is at least half-way visible (vertically)
 * @return if multiple objects are found, return only the first
 */
function getExhibitInView(entirely) {
  let windowTop = $(window).scrollTop();
  let windowHeight = $(window).height();

  for (let i=0; i<exhibits.length; i++) {
    let wrapper = exhibits[i].getWrapper();
    let wrapperTop = $(wrapper).offset().top;  // Y where the section begins
    let wrapperBottom = $(wrapper).offset().top + wrapper.offsetHeight; // Y where the section ends

    if (entirely &&
        windowTop < wrapperTop &&
        windowTop + windowHeight > wrapperBottom) {
      // found an exhibit entirely on display, exit with value
      return exhibits[i];
    }

    if (!entirely &&
      windowTop + windowHeight > wrapperTop &&
      windowTop < wrapperBottom) {
      // found an exhibit partially (>50%) on display, exit with value
      return exhibits[i];
    }
  }  
  // if none found
  return null;
}

