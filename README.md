# active-code
Annotate code snippets in HTML pages with pop-up explanations.

# User guide

You need to publish, along with your HTML contents, the JavaScript and CSS resources
from the `active-code` and `highlight` directories
(the latter is used for syntax highlighting of code snippets,
and copied without modification from the [highlight.js](https://highlightjs.org/) library).

In the HTML page that contains the code snippets,
you need to include the following lines in the `<head>` section:

```html
<link rel="stylesheet" href="active-code/active-code.css">
<link rel="stylesheet" href="highlight/default.css">
```

You may need to adjust the paths to the CSS files depending on the structure of your website.

Then, you need to include the following lines at the end of the `<body>` section:

```html
<script src="highlight/highlight.min.js"></script>
<script>hljs.highlightAll();</script>

<script src="https://code.jquery.com/jquery-3.6.0.min.js"
    integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>

<script>
    var active_code_location = "active-code/"
</script>
<script src="active-code/active-code.js"></script>
```

Again, you may need to adjust the paths to the JavaScript files depending on the structure of your website.

Code snippets have to be included in `<pre><code>` blocks,
where the `pre` element has to have the class `active-code`.
For example:

```html
<pre class="active-code"><code class="language-python"># With the other imports at the beginning:
from flask_login import LoginManager
(...)

# Inside create_app:
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.init_app(app)
from . import model

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(model.User, int(user_id))</code></pre>
```

Immediately after the `pre` element, you need to include a `div` element with the class `active-explanation`,
which contains `div` elements of the class `active-explanation` with explanations to individual fragments
of the code snippet. For example:

```html
<div class="active-explanation">
    <div class="explanation-fragment" data-limits="login_manager.login_view = 'auth.login'">
        When the <code>Flask-Login</code> extension needs to redirect the user to the login form,
        it will redirect it to the path associated to the <code>login</code> controller function
        of the <code>auth</code> blueprint.
    </div>
    <div class="explanation-fragment" data-limits="@login_manager.user_loader">
        The function decorated with <code>user_loader</code>
        will be called by the <code>Flask-Login</code> extension
        when it needs to load a user object from the database
        given its id.
    </div>
    <div class="explanation-fragment" data-limits="from . import model">
        The <code>model</code> module needs to be imported
        because it's accessed in the <code>load_user</code> function.
        It's imported here,
        and not at the beginning of the file,
        to avoid circular imports,
        since the <code>model</code> module needs to import the <code>db</code> object
        from this module.
    </div>
    <div class="explanation-fragment" data-limits="db.session.get(model.User, int(user_id))">
        This is a convenient way of retrieving and object from the database
        given its class and its primary key.
        It's equivalent to composing a query
        that looks for a user whose id is equal to <code>user_id</code>,
        executing it and getting the first result.
    </div>
</div>
```

The `data-limits` attribute of each `explanation-fragment` element
specifies the fragment of the code snippet that will be highlighted when the mouse is over the explanation.
It can be the full piece of code that is being explained,
or its beginning and end separated by an ellipsis (`...`).
For example: `data-limits="db.session...))"`.
See the [examples directory](examples/) for more examples of how to write code.
