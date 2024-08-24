const content = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                
                >
    <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
    <xsl:template match="/">
        <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <title>XML Sitemap</title>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                <style type="text/css">
/* Body and Background */
body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 16px;
    color: #33cc33; /* Softer green text */
    background-color: #000000; /* Black background */
    margin: 0;
    padding: 0;
}

/* Links */
a {
    color: #33cc33; /* Softer green text */
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}

/* Table Styling */
table {
    border: 1px solid #004400; /* Green border */
    border-collapse: collapse;
    width: 100%;
    background-color: #000000; /* Black background */
}
th {
    text-align: left;
    padding-right: 30px;
    font-size: 11px;
    color: #33cc33; /* Softer green text */
    border-bottom: 1px solid #004400; /* Green bottom border */
}
td {
    font-size: 11px;
    padding: 5px;
    color: #339933; /* Softer green text */
    border-top: 1px solid #004400; /* Green top border */
}
tr:nth-child(odd) td {
    background-color: #001100; /* Dark green background for odd rows */
}
tr:hover td {
    background-color: #002200; /* Slightly brighter green on hover */
}

/* Page Content */
#content {
    margin: 0 auto;
    padding: 2% 5%;
    max-width: 800px;
}

/* Description Paragraph */
.desc {
    margin: 18px 3px;
    line-height: 1.5em;
    color: #00ff00; /* Green text */
}
.desc a {
    color: #00ff00; /* Green links */
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
    color: #ff0000; /* Green headings */
    font-family: 'Courier New', Courier, monospace;
}

/* Additional Styling */
hr {
    border: 0;
    height: 1px;
    background: #00ff00; /* Green horizontal line */
}

                </style>
            </head>
            <body>
                <div id="content">
                    <h1>XML Sitemap</h1>
                    <p class="desc">
                        The sitemap generated to allow search engines to discover this blog's content.
                    </p>
                                        
                    <xsl:if test="count(sitemap:sitemapindex/sitemap:sitemap) > 0">
                        <table id="sitemap" cellpadding="3">
                            <thead>
                                <tr>
                                    <th width="75%">Sitemap</th>
                                    <th width="25%">Last Modified</th>
                                </tr>
                            </thead>
                            <tbody>
                                <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                                    <xsl:variable name="sitemapURL">
                                        <xsl:value-of select="sitemap:loc"/>
                                    </xsl:variable>
                                    <tr>
                                        <td>
                                            <a href="{$sitemapURL}"><xsl:value-of select="sitemap:loc"/></a>
                                        </td>
                                        <td>
                                            <xsl:value-of select="concat(substring(sitemap:lastmod, 1, 10), ' ', substring(sitemap:lastmod, 12, 5))"/>
                                        </td>
                                    </tr>
                                </xsl:for-each>
                            </tbody>
                        </table>
                    </xsl:if>
                    <xsl:if test="count(sitemap:sitemapindex/sitemap:sitemap) = 0">
                        <table id="sitemap" cellpadding="3">
                            <thead>
                                <tr>
                                    <th width="70%">URL (<xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> total)</th>
                                    <th>Type</th>
                                    <th>Images</th>
                                    <th>Lang</th>
                                    <th>EN</th>
                                    <th>PL</th>
                                    <th>ES</th>
                                    <th title="Last Modification Time" width="15%">Last Modified</th>
                                </tr>
                            </thead>
                            <tbody>
                                <xsl:for-each select="sitemap:urlset/sitemap:url">
                                    <tr>
                                        <td>
                                            <xsl:variable name="itemURL">
                                                <xsl:value-of select="sitemap:loc"/>
                                            </xsl:variable>
                                            <a href="{$itemURL}">
                                                <xsl:value-of select="sitemap:loc"/>
                                            </a>
                                        </td>
                                        <td>
                                            <xsl:choose>
                                                <xsl:when test="contains(sitemap:loc, '/posts/')">
                                                    <xsl:text>📗 post</xsl:text>
                                                </xsl:when>
                                                 <xsl:otherwise>
                                                    <xsl:text>📘 page</xsl:text>
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </td>
                                        <td>
                                            <xsl:value-of select="count(image:image)"/>
                                        </td>
                                        <td>
                                            <xsl:choose>
                                                <xsl:when test="contains(sitemap:loc, '/posts/pl')">
                                                    <xsl:text>🇵🇱</xsl:text>
                                                </xsl:when>
                                                <xsl:when test="contains(sitemap:loc, '/posts/es')">
                                                    <xsl:text>🇪🇸</xsl:text>
                                                </xsl:when>
                                                <xsl:when test="starts-with(substring-after(sitemap:loc, 'https://gustawdaniel.com/'), 'pl')">
                                                    <xsl:text>🇵🇱</xsl:text>
                                                </xsl:when>
                                                <xsl:when test="starts-with(substring-after(sitemap:loc, 'https://gustawdaniel.com/'), 'es')">
                                                    <xsl:text>🇪🇸</xsl:text>
                                                </xsl:when>
                                                <xsl:otherwise>
                                                    <xsl:text>🇺🇸</xsl:text>
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </td>
                                        <td>
                                             <xsl:if test="count(*[@hreflang='en']) > 0">
                                                <a href="{(*[@hreflang='en'])/@href}">
                                                    🇺🇸
                                                </a>
                                             </xsl:if>
                                        </td>
                                        <td>
                                             <xsl:if test="count(*[@hreflang='pl']) > 0">
                                                <a href="{(*[@hreflang='pl'])/@href}">
                                                    🇵🇱
                                                </a>
                                                <xsl:text> </xsl:text>
                                             </xsl:if>
                                        </td>
                                        <td>     
                                             <xsl:if test="count(*[@hreflang='es']) > 0">
                                                <a href="{(*[@hreflang='es'])/@href}">
                                                    🇪🇸
                                                </a>
                                             </xsl:if>
                                        </td>
                                        <td>
                                            <xsl:value-of select="concat(substring(sitemap:lastmod, 1, 10), ' ', substring(sitemap:lastmod, 12, 5))"/>
                                        </td>
                                    </tr>
                                </xsl:for-each>
                            </tbody>
                        </table>
                    </xsl:if>
                </div>
            </body>
        </html>

    </xsl:template>
</xsl:stylesheet>
`;

export async function GET() {
    return new Response(content.trim(), {
        headers: {
            'Content-Type': 'text/xsl',
        }
    })
}
