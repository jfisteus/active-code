let language;

/*
 * Location of the active-code resources (images, etc.)
 * relative to the HTML file including this script.
 * It can be overridden before including this script:
 *
 *   <script>
 *     var active_code_location = "../active-code/"
 *   </script>
 *  <script src="../active-code/active-code.js"></script>
 *
 * The default value assumes that the HTML file including this script
 * is in a directory two levels below the active-code directory.
 *
 */
var active_code_location = active_code_location || "../../active-code/"

// Check if highlight.js is loaded
if (typeof hljs === 'undefined') {
    hljs_loaded = false;
} else {
    hljs_loaded = true;
}

const T = {
    "en": {
        "copy_icon": "Copy code to clipboard",
        "active_code_icon": "Highlight code with explanations available"
    },
    "es": {
        "copy_icon": "Copiar código al portapapeles",
        "active_code_icon": "Resaltar código con explicaciones disponibles"
    }
};


$(function () {
    language = $('html').attr('lang') || 'en'; // Default to 'en' if no lang attribute is set
    $('pre.active-code').each(function () {
        render_active_code(this);
    });
});


class ActiveCode {
    constructor(code_element, explanation_fragments) {
        this.code_element = $(code_element); // The code element to be rendered
        this.explanation_fragments = explanation_fragments; // Array of explanation fragments
    }

    create_explanation_elements() {
        for (let explanation_fragment of this.explanation_fragments) {
            this.create_explanation_element(explanation_fragment);
        }
        this.attach_explanation_elements();
    }

    create_explanation_element(explanation_fragment) {
        let element = $("<div>")
            .addClass("active-code-explanation")
            .append(explanation_fragment.explanation.html())
            .css({
                "display": "none"
            });
        explanation_fragment.explanation_element = element;
    }

    attach_explanation_elements() {
        let explanation_elements_container = $("<div>")
            .addClass("active-code-explanations-container")
            .insertAfter(this.code_element);
        for (let explanation_fragment of this.explanation_fragments) {
            if (explanation_fragment.code_fragment_element) {
                explanation_elements_container.append(explanation_fragment.explanation_element);
            } else {
                console.warn("Code fragment element not found for explanation fragment", explanation_fragment);
            }
        }
    }

    register_code_fragment_listeners() {
        let code_fragments = this.code_element.find(".active-fragment");
        // zip code_fragments and explanation fragments
        for (let i = 0; i < code_fragments.length; i++) {
            let code_fragment = $(code_fragments[i]);
            code_fragment.on("mouseenter", (event) => {
                if (
                    $(event.currentTarget).hasClass("active-fragment-active") &&
                    !isTextSelectedInElement($(event.currentTarget))
                ) {
                    // Position the explanation element relative to the code fragment
                    let rect = code_fragments[i].getBoundingClientRect();
                    let offset_top = rect.height + code_fragments[i].offsetTop + 10;
                    let offset_left = code_fragments[i].offsetLeft + 10;
                    this.explanation_fragments[i].explanation_element.css({
                        "left": offset_left + "px",
                        "top": offset_top + "px"
                    });
                    // Make it show
                    this.explanation_fragments[i].explanation_element.css("display", "block");
                }
            }).on("mouseleave", () => {
                this.explanation_fragments[i].explanation_element.css("display", "none");
            });
        }
    }
}


class ExplanationFragment {
    constructor(start_pos, end_pos, code, explanation) {
        this.start_pos = start_pos; // Start position of the fragment in the code
        this.end_pos = end_pos; // End position of the fragment in the code
        this.code = code; // Code fragment as a string
        this.explanation = explanation; // Explanation element for the fragment
        this.explanation_element = undefined;
        this.code_fragment_element = undefined;
    }

    to_element() {
        // Create a new span element for the code fragment, with no contents yet
        let code_span = $("<span>")
            .addClass("active-fragment")
            .addClass("active-fragment-active")
        this.code_fragment_element = code_span;
        return code_span;
    }
}


function render_active_code(code_element) {
    code_element = $(code_element);
    let has_explanations = false;;
    let explanations = code_element.next(".active-explanation");
    let code = code_element.find('code');
    let active_code;
    let highlighted_code;
    if (code.length !== 1) {
        console.warn("Expected exactly one code element. Found: " + code.length);
        return;
    }
    if (explanations.length === 1) {
        has_explanations = true;
        if (hljs_loaded && !code.hasClass("hljs")) {
            hljs.highlightElement(code[0]); // Highlight the code using highlight.js
        }
        highlighted_code = highlighted_code_structure(code);
        // Replace the original code with the rendered code
        active_code = create_active_code(highlighted_code, explanations);
        // Replace the contents of code with the contents of active_code.code_element
        code.empty();
        code.append(active_code.code_element.contents());
        active_code.code_element = code;
        active_code.create_explanation_elements();
        active_code.register_code_fragment_listeners();
    }
    code_element.prepend(
        $("<img>")
            .attr("src", active_code_location + "active-code-copy.svg")
            .attr("alt", "Copy code icon")
            .attr("title", T[language]["copy_icon"])
            .addClass("active-code-copy-icon")
            .click(function () {
                navigator.clipboard.writeText(code.text())
                    .then(() => {
                        console.log("Code copied to clipboard!");
                        // Optionally, you can show a message to the user
                        $(this)
                            .attr("src", active_code_location + "active-code-copied.svg")
                            .addClass("active-code-copy-icon-clicked");
                        setTimeout(() => {
                            $(this).attr("src", active_code_location + "active-code-copy.svg");
                            $(this).removeClass("active-code-copy-icon-clicked");
                        }, 1000); // Reset the icon after 2 seconds
                    })
                    .catch(err => {
                        console.error("Failed to copy code: ", err);
                    });
            })
    );
    if (has_explanations) {
        code_element.prepend(
            $("<img>")
                .attr("src", active_code_location + "active-code-regular.svg")
                .attr("alt", "Active code icon")
                .attr("title", T[language]["active_code_icon"])
                .addClass("active-code-icon")
                .click(function () {
                    if (!$(this).hasClass("active-code-icon-active")
                        && !$(this).hasClass("active-code-icon-disabled")) {
                        // Change to active code active mode
                        $(this).addClass("active-code-icon-active");
                        $(this).attr("src", active_code_location + "active-code-active.svg");
                        // Show active code fragments
                        active_code.code_element.find(".active-fragment").addClass("active-fragment-highlighted");
                    } else if ($(this).hasClass("active-code-icon-active")) {
                        // Disable active code
                        $(this).removeClass("active-code-icon-active");
                        $(this).addClass("active-code-icon-disabled");
                        $(this).attr("src", active_code_location + "active-code-disabled.svg");
                        // Hide the explanations
                        active_code.code_element
                            .find(".active-fragment")
                            .removeClass("active-fragment-highlighted")
                            .removeClass("active-fragment-active");
                    } else if ($(this).hasClass("active-code-icon-disabled")) {
                        // Change back to regular code mode with active code enabled
                        $(this).removeClass("active-code-icon-disabled");
                        $(this).attr("src", active_code_location + "active-code-regular.svg");
                        code_element
                            .find(".active-fragment")
                            .addClass("active-fragment-active");
                    }
                })
        );
    }
}


function create_active_code(highlighted_code, explanations) {
    let explanation_fragments = [];
    explanations.find(".explanation-fragment").each(function () {
        explanation_fragments.push(get_explanation_fragment(this, highlighted_code));
    });
    // Sort fragments by start position
    explanation_fragments.sort(function (a, b) {
        return a.start_pos - b.start_pos;
    });
    // Explanation fragments cannot overlap
    for (let i = 1; i < explanation_fragments.length; i++) {
        if (explanation_fragments[i].start_pos < explanation_fragments[i - 1].end_pos) {
            console.warn("Explanation fragments overlap!", explanation_fragments[i - 1], explanation_fragments[i]);
        }
    }
    // Make the components of highlighted_code align with the fragment
    for (let fragment of explanation_fragments) {
        highlighted_code.apply_fragment(fragment);
    }
    // Now, render the code
    let rendered_code = $("<code>");
    let current_component_index = 0;
    for (let fragment of explanation_fragments) {
        let fragment_component_start_index = highlighted_code.locate_position(fragment.start_pos);
        let fragment_component_end_index = highlighted_code.locate_position(fragment.end_pos - 1);
        // Append the elements before the fragment
        while (current_component_index < fragment_component_start_index) {
            let component = highlighted_code.code_components[current_component_index];
            rendered_code.append(component.to_element());
            current_component_index += 1;
        }
        // Create the element for the fragment
        let fragment_element = fragment.to_element();
        rendered_code.append(fragment_element);
        // Append the fragment component(s)
        while (current_component_index <= fragment_component_end_index) {
            let component = highlighted_code.code_components[current_component_index];
            fragment_element.append(component.to_element());
            current_component_index += 1;
        }
    }
    // Append any remaining components after the last fragment
    while (current_component_index < highlighted_code.code_components.length) {
        let component = highlighted_code.code_components[current_component_index];
        rendered_code.append(component.to_element());
        current_component_index += 1;
    }
    return new ActiveCode(rendered_code, explanation_fragments);
}


class HighlightedCode {
    constructor(code_components) {
        this.code_components = code_components;
        this.text = this.collate_text();
    }

    get length() {
        return this.text.length;
    }

    /*
     * Restructure components so that fragments contain full components,
     * splitting components as needed to match the fragment positions.
     *
     * fragment: ExplanationFragment
     */
    apply_fragment(fragment) {
        let start_component_index = this.locate_position(fragment.start_pos);
        let start_component = this.code_components[start_component_index];
        let new_start_components = [];
        if (fragment.start_pos > start_component.start_pos) {
            // Split start component
            new_start_components = start_component.split(
                fragment.start_pos - start_component.start_pos
            );
        }
        if (new_start_components.length > 0) {
            // Replace start component with the two new components
            this.code_components.splice(
                start_component_index,
                1,
                new_start_components[0],
                new_start_components[1]
            );
        }
        let end_component_index = this.locate_position(fragment.end_pos - 1);
        let end_component = this.code_components[end_component_index];
        let new_end_components = [];
        if (fragment.end_pos < end_component.start_pos + end_component.length) {
            // Split end component
            new_end_components = end_component.split(
                fragment.end_pos - end_component.start_pos
            );
        }
        if (new_end_components.length > 0) {
            // Replace end component with the two new components
            this.code_components.splice(
                end_component_index,
                1,
                new_end_components[0],
                new_end_components[1]
            );
        }
    }

    collate_text() {
        let text = "";
        for (let component of this.code_components) {
            text += component.text;
        }
        return text;
    }

    locate_position(pos) {
        let current_pos = 0;
        for (let i in this.code_components) {
            let component = this.code_components[i];
            if (current_pos + component.length > pos) {
                return i;
            }
            current_pos += component.length;
        }
        throw new Error("Position out of bounds: " + pos);
    }
}


class HighlightedCodeComponent {
    /*
     * highlighted_classes is a string with the classes assigned by highlight.js (or null)
     * text is the text content of the code component
     * start_pos is the position of the component in the original code
     */
    constructor(highlighted_classes, text, start_pos) {
        // highlighted_classes is a string.
        // It can be null if highlight.js has not marked it.
        this.highlighted_classes = highlighted_classes;
        this.text = text;
        this.start_pos = start_pos;
        this.children = [];
    }

    get length () {
        return this.text.length;
    }

    split(at_index) {
        let first_component = new HighlightedCodeComponent(
            this.highlighted_classes,
            this.text.substring(0, at_index),
            this.start_pos
        );
        let second_component = new HighlightedCodeComponent(
            this.highlighted_classes,
            this.text.substring(at_index),
            this.start_pos + at_index
        );
        // Split children as well
        let current_index = 0;
        for (let child of this.children) {
            if (current_index + child.length <= at_index) {
                // Child goes to first component
                first_component.children.push(child);
            } else if (current_index >= at_index) {
                // Child goes to second component
                second_component.children.push(child);
            } else {
                // Child needs to be split
                let split_index = at_index - current_index;
                let split_children = child.split(split_index);
                first_component.children.push(split_children[0]);
                second_component.children.push(split_children[1]);
            }
            current_index += child.length;
        }
        return [first_component, second_component];
    }

    to_element() {
        if (this.highlighted_classes) {
            let element = $("<span>")
                .attr("class", this.highlighted_classes);
            // If there are child components, render them recursively
            for (let child of this.children) {
                element.append(child.to_element());
            }
            return element;
        } else {
            return document.createTextNode(this.text);
        }
    }
}


function highlighted_code_component(node, current_pos) {
    if (node[0].nodeType === Node.TEXT_NODE) {
        return new HighlightedCodeComponent(null, node.text(), current_pos);
    } else if (node[0].nodeType === Node.ELEMENT_NODE) {
        // Check that the element is a span:
        if (node.is("span")) {
            let code_component = new HighlightedCodeComponent(node.attr("class"), node.text(), current_pos);
            // Process child element nodes recursively
            let child_pos = current_pos;
            node.contents().each(function () {
                let child_node = $(this);
                let child_component = highlighted_code_component(child_node, child_pos);
                code_component.children.push(child_component);
                child_pos += child_component.length;
            });
            return code_component;
        } else {
            throw new Error("Unsupported element type in code element: " + node.prop("tagName"));
        }
    } else {
        throw new Error("Unsupported node type in code element: " + node[0].nodeType);
    }
}

function highlighted_code_structure(code_element) {
    let components = [];
    let current_pos = 0;
    // Iterate over the child nodes of the code element, which is a jQuery object
    code_element.contents().each(function () {
        let node = $(this);
        let component = highlighted_code_component(node, current_pos);
        components.push(component);
        current_pos += component.length;
    });
    return new HighlightedCode(components);
}

// Example of HTML code:
//
//             <pre class="active-code active-code"><code>@bp.route("/")
// def index():
//     user = model.User(1, "mary@example.com", "mary")
//     posts = [
//         model.Post(
//             1, user, "Test post", datetime.datetime.now(dateutil.tz.tzlocal())
//         ),
//         model.Post(
//             2, user, "Another post", datetime.datetime.now(dateutil.tz.tzlocal())
//         ),
//     ]
//     return render_template("main/index.html", posts=posts)</code></pre>

//             <div class="active-explanation">
//                 <div class="explanation-fragment" data-limits='@bp...("/")'>
//                     The <code>@bp.route("/")</code> decorator
//                     register the controller function <code>index</code>
//                     to be run when a request arrives
//                     for the path <code>/</code>.
//                     The variable <code>bp</code> points to the blueprint
//                     this controller function belongs to.
//                 </div>
//                 <div class="explanation-fragment" data-limits="return...posts)">
//                     The controller function
//                     returns as response the result of rendering the template <code>main/index.html</code>
//                     with a <code>posts</code> parameter that contains
//                     the list of posts to be displayed.
//                 </div>
//             </div>


function get_explanation_fragment(explanation, highlighted_code) {
    explanation = $(explanation);
    let limits = explanation.attr("data-limits");
    if (!limits) {
        console.warn("No limits defined for explanation fragment", explanation);
        return;
    }
    // Split limits into start and end
    let limits_split = limits.split("...");
    let start;
    let end;
    if (limits_split.length == 2) {
        start = limits_split[0].trim();
        end = limits_split[1].trim();
    } else if (limits_split.length == 1) {
        start = limits_split[0].trim();
        end = undefined;
    } else {
        // Invalid limits format
        console.warn("Invalid limits format for explanation fragment", explanation);
        return;
    }
    let start_pos;
    let end_pos;
    if (start !== "") {
        start_pos = highlighted_code.text.indexOf(start);
        if (start_pos === -1) {
            console.warn("Start limit not found in code: " + start);
            return;
        }
    } else {
        start_pos = 0; // Start from the beginning of the code
    }
    if (end == "") {
        end_pos = highlighted_code.length; // End at the end of the code
    } else if (end === undefined) {
        end_pos = start_pos + start.length; // End at the end of the start string
    } else {
        end_pos = highlighted_code.text.indexOf(end, start_pos);
        if (end_pos === -1) {
            console.warn("End limit not found in code: " + end);
            return;
        }
        end_pos += end.length; // Include the length of the end string
    }
    // Ensure start_pos is not greater than end_pos
    if (start_pos >= end_pos) {
        console.warn("Start position is greater or equal than end position", start_pos, end_pos);
        return;
    }
    // Extract the code fragment
    let code_fragment = highlighted_code.text.substring(start_pos, end_pos);
    // Create a new ExplanationFragment instance
    let fragment = new ExplanationFragment(
        start_pos,
        end_pos,
        code_fragment,
        explanation
    );
    return fragment;
};

function isTextSelectedInElement(element) {
    let selection = window.getSelection();
    if (!selection || selection.isCollapsed) return false;
    let range = selection.getRangeAt(0);
    // check if element[0] is a descendant of the common ancestor container of the range
    return range.commonAncestorContainer.contains(element[0]);
}
