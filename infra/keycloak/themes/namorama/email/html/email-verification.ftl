<#import "template.ftl" as layout>
<@layout.emailLayout>
  <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#0b0e10;">Vérifiez votre adresse email</h2>
  <p style="margin:0 0 24px;font-size:15px;color:#2c3532;line-height:1.6;">
    Bonjour<#if user.firstName??> ${user.firstName}</#if>,<br><br>
    Merci de créer votre compte Namorama. Cliquez sur le bouton ci-dessous pour confirmer votre adresse email.
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr>
      <td style="border-radius:8px;background-color:#0d9a63;">
        <a href="${link}" target="_blank"
           style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:8px;">
          Vérifier mon email
        </a>
      </td>
    </tr>
  </table>
  <!-- URL en clair sous le bouton : de nombreux clients mail dégradent ou
       suppriment les boutons stylés. Sans ce repli, le message devient
       inutilisable — et c'est un parcours d'authentification. -->
  <p style="margin:0 0 8px;font-size:12px;color:#8a938f;line-height:1.5;">
    Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
    <span style="word-break:break-all;color:#5c6663;">${link}</span>
  </p>
  <p style="margin:0 0 8px;font-size:13px;color:#5c6663;">
    Ce lien est valide pendant <strong>${linkExpiration}</strong>.
  </p>
  <p style="margin:0;font-size:13px;color:#5c6663;">
    Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
  </p>
</@layout.emailLayout>
