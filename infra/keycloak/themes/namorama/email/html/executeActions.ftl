<#import "template.ftl" as layout>
<@layout.emailLayout>
  <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#0b0e10;">Une action est requise sur votre compte</h2>
  <p style="margin:0 0 24px;font-size:15px;color:#2c3532;line-height:1.6;">
    Bonjour<#if user.firstName??> ${user.firstName}</#if>,<br><br>
    Votre compte Namorama nécessite une action de votre part. Cliquez sur le bouton ci-dessous pour la réaliser.
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr>
      <td style="border-radius:8px;background-color:#0d9a63;">
        <a href="${link}" target="_blank"
           style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:8px;">
          Continuer
        </a>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 8px;font-size:12px;color:#8a938f;line-height:1.5;">
    Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
    <span style="word-break:break-all;color:#5c6663;">${link}</span>
  </p>
  <p style="margin:0 0 8px;font-size:13px;color:#5c6663;">
    Ce lien est valide pendant <strong>${linkExpiration}</strong>.
  </p>
  <p style="margin:0;font-size:13px;color:#5c6663;">
    Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.
  </p>
</@layout.emailLayout>
