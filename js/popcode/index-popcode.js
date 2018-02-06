const CONFIG1 = {
  "particles": {
    "number": {
      "value": 180,
      "density": {
        "enable": true,
        "value_area": 800
      }
    },
    "color": {
      "value": "#78c61b",
    },
    "shape": {
      "type": "circle",
      "stroke": {
        "width": 0,
        "color": "#000000"
      },
      "polygon": {
        "nb_sides": 5
      },
      "image": {
        "src": "img/github.svg",
        "width": 100,
        "height": 100
      }
    },
    "opacity": {
      "value": 0.3,
      "random": false,
      "anim": {
        "enable": false,
        "speed": 1,
        "opacity_min": 0.1,
        "sync": false
      }
    },
    "size": {
      "value": 4,
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
      "color": "#3a3835",
      "opacity": 0.15,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 1,
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
        "enable": true,
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
const CONFIG_POPPY_1 = {
  "config": {
    "autoStart": false,
    "genTimeFrame": 50, // average circle popping rate (ms) - min. is 50. For faster rates, set poppers to values > 1.
    "poppers": 5, // set to more than 1 for multiplying popping rate given by genTimeFrame
    "freezeTime": 1000, // how long to suspend popping on mouse mouve events (ms)
    "distort": false, // draw any distorted circles?
    "distortAll": false,  // if distorting, distort all?
    "distortionMargin": 0.5, // if distorting, maximum degree of distortion
    "fill": false, // fill any circles?
    "fillAll": true, // if filling, fill all?
    "stroke": true, // stroke any circles?
    "strokeAll": true, // if stroking, stroke all?
    "chancesTransparent": 0.7,  // how many percent shall have any transparency? - value will vary randomly
    "basicSize": 40, // basic size for a circle
    "varSize": true,  // should sizes vary?
    "minSize": 20, // minimum size for a cricle
    "sizeVariationFactor": 5.5, // circles of different sizes? how much should they vary?
                                // enter values >=1, 1 is for no variation
    "perspective": true,

    "bgColor": 'rgb(245, 245, 220)', // beige, default
    "eraserColor": 'rgba(245,245,220,0.1)'
  }
}
const CONFIG_POPPY_2 = {
  "config": {
    "autoStart": false,
    "genTimeFrame": 50, // average circle popping rate (ms) - min. is 50. For faster rates, set poppers to values > 1.
    "poppers": 2, // set to more than 1 for multiplying popping rate given by genTimeFrame
    "freezeTime": 1000, // how long to suspend popping on mouse mouve events (ms)
    "distort": false, // draw any distorted circles?
    "distortAll": false,  // if distorting, distort all?
    "distortionMargin": 0.5, // if distorting, maximum degree of distortion
    "fill": true, // fill any circles?
    "fillAll": true, // if filling, fill all?
    "stroke": true, // stroke any circles?
    "strokeAll": false, // if stroking, stroke all?
    "chancesTransparent": 0.7,  // how many percent shall have any transparency? - value will vary randomly
    "basicSize": 40, // basic size for a circle
    "varSize": true,  // should sizes vary?
    "minSize": 20, // minimum size for a cricle
    "sizeVariationFactor": 2.5, // circles of different sizes? how much should they vary?
                                // enter values >=1, 1 is for no variation
    "perspective": false,

    "bgColor": 'rgb(245, 245, 220)', // beige, default
    "eraserColor": 'rgba(245,245,220,0.2)'
  }
}
const CONFIG_POPPY_3 = {
  "config": {
    "autoStart": false,
    "genTimeFrame": 100, // average circle popping rate (ms) - min. is 50. For faster rates, set poppers to values > 1.
    "poppers": 1, // set to more than 1 for multiplying popping rate given by genTimeFrame
    "freezeTime": 1000, // how long to suspend popping on mouse mouve events (ms)
    "distort": true, // draw any distorted circles?
    "distortAll": true,  // if distorting, distort all?
    "distortionMargin": 0.3, // if distorting, maximum degree of distortion
    "fill": true, // fill any circles?
    "fillAll": true, // if filling, fill all?
    "stroke": false, // stroke any circles?
    "strokeAll": false, // if stroking, stroke all?
    "chancesTransparent": 0.7,  // how many percent shall have any transparency? - value will vary randomly
    "basicSize": 40, // basic size for a circle
    "varSize": true,  // should sizes vary?
    "minSize": 20, // minimum size for a cricle
    "sizeVariationFactor": 2.5, // circles of different sizes? how much should they vary?
                                // enter values >=1, 1 is for no variation
    "perspective": false,

    "bgColor": 'rgb(245, 245, 220)', // beige, default
    "eraserColor": 'rgba(245,245,220,0.1)'
  }
}


let parallaxDivs; // array of DOM element objects
let particlesDiv; // $ object
let paraFactor = -0.35; // use negative values starting from 0 (for no parallax at all)


let exhibits = []; // where all the specific project objects will be

// ------- STATE --------- //
// window resize and scroll events will trigger hold and go for the exhibit sections, but in a rebounce-fashion
let wannaGoTimeout = null;
let timeoutValue = 500;


window.onload = function() {
  // particle animations initialization
  particlesJS('particles-js', CONFIG1);
  particlesDiv = $('#particles-js')[0];  // holding the canvas where particles are rendered
  parallaxWrappers = $('.parallax-wrapper').toArray(); // all possible places where particlesDiv can be contained as child

  // project 1 init - function from poppy.js
  let project1 = poppyJS('exhibit-content-1', CONFIG_POPPY_1);
  // autostart off = for performance reasons (go only when on display - scrollhandled)
  exhibits.push(project1);

  // project 2 init
  let project2 = poppyJS('exhibit-content-2', CONFIG_POPPY_2);
  exhibits.push(project2);

  // project 3 init
  let project3 = poppyJS('exhibit-content-3', CONFIG_POPPY_3);

  exhibits.push(project3);

  // listener for scrolling
  window.onscroll = handleScroll;
}

// DO THIS ON EVERY SCROLL EVENT
function handleScroll(e) {

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

    // change particles div position according to displacement
    $(particlesDiv).css('top', displacement+'px');
  } else {
    // for performance reasons...
    if (particlesDiv.parentNode) {
      particlesDiv.parentNode.removeChild(particlesDiv);
    }
  }


  // HANDLE EXHIBITS
  let toPresent = getExhibitInView(true);
  if (toPresent) {
    if (wannaGoTimeout) {
      clearTimeout(wannaGoTimeout);
    }
    wannaGoTimeout = setTimeout(toPresent.go.bind(toPresent), timeoutValue);
  } else {
    // stop all, making sure the last one running stops
    exhibits.forEach(p => p.hold());
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
 * @param entirely: only return if exhibit is completely on screen
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
      // found an exhibit partially on display, exit with value
      return exhibits[i];
    }
  }
  // if none found
  return null;
}
