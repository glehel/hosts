<h1><img alt="" width="48" height="48" src="resources/icon.png"/>HOSTS/Ad-Block</h1>

<img alt="" src="resources/icon.gif"/>


Suggested usage: fork it, replace <code>/USERNAME/</code> with your GitHub-username, use links (direct download).

<pre>
https://raw.githubusercontent.com/USERNAME/hosts/master/_raw__hosts.txt
<hr/>
https://raw.githubusercontent.com/USERNAME/hosts/master/build/hosts.txt
https://raw.githubusercontent.com/USERNAME/hosts/master/build/hosts0.txt
<hr/>
https://raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_with_localhost.txt
https://raw.githubusercontent.com/USERNAME/hosts/master/build/hosts0_with_localhost.txt
<hr/>
https://raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_adblock.txt

https://raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_adblock_anti_annoyances_hide.txt
https://raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_adblock_anti_annoyances_block.txt
https://raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_adblock_anti_annoyances_block_inline_script.txt
https://raw.githubusercontent.com/USERNAME/hosts/master/build/hosts_adblock_anti_annoyances_style_inject.txt
</pre>

Or download it all in an archive:
<pre>
https://github.com/USERNAME/hosts/archive/master.zip
</pre>

<hr/>

The <code>_raw__hosts.txt</code> file is just a raw list of the host-domains (without any prefix),
<code>hosts.txt</code> uses <code>127.0.0.1 </code> prefix for each line,
<code>hosts0.txt</code> uses <code>0.0.0.0 </code> prefix for each line,
<code>hosts_with_localhost.txt</code> and <code>hosts0_with_localhost.txt</code> uses the same prefixes but adds an additional entries for machine's self-<code>localhost</code>.

The <code>hosts_adblock.txt</code> has the same content as <code>_raw__hosts.txt</code> built with an additional <a href="https://github.com/gorhill/uBlock/wiki/Static-filter-syntax/">uBlock-filter format</a> file-headers.

<hr/>

For developers - download/clone, modify any of the <code>_raw_...</code> lists and run <code>_builder.js</code> using a NodeJS that is compatible with your operation-system <sup>(for example: <em><a href="https://nodejs.org/download/nightly/v9.1.1-nightly201711075f5ef4226e/win-x86/node.exe">Windows</a></em>)</sup>.

<hr/>

<br/>

<a href="https://paypal.me/e1adkarak0" ok><img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal Donation" ok></a>

