
import * as nodemailer from 'nodemailer';
import {Injectable} from '@angular/core';
import {CONFIG} from 'src/mail.config';
import {MailModel} from '../models/mail-model';

@Injectable()
export class MailService {

  constructor() {
  }

  getHTMLTemplate = (mailContent: string): string => {
    const body = `
<html><head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8'></head><body>
<center style='margin: 0;'>
    <table width='570' style='min-width: 570px;
    border-spacing: 0 !important; margin: 0 auto; border: 5px solid #edf0f4;'>
    <tbody width='570' style='min-width: 570px; margin: 0;'>
    <tr width='570' style='min-width: 570px; margin: 0;'>
    <td width='570' style='min-width: 570px; margin: 0; padding: 0;'>

    <div id='wrapper' style='width: 570px; overflow: auto; padding-top: 0px; margin: 0 auto;'>

    <div id='header' style='margin: 0;'>
        <table width='570px' style='border-spacing: 0 !important; margin: 0;'>
        <tbody><tr style='margin: 0; background-color: %mailHeaderBackgroundColor%;'>
        <td style='margin: 0; padding: 0;'>
        <br style='margin: 0;'>
        <br style='margin: 0;'>

        <center style='margin: 0;'>
        <a href='%siteURL%' target='_blank' style='text-decoration: none; color: #8b9198; margin: 0;'>
        <img src='%logoURL%' alt='%projectName%' style='margin: 0;'>
        </a>
        </center>

        <br style='margin: 0;'>
        </td>
        </tr>

        <tr style='margin: 0;'>
        <td style='margin: 0; padding: 0;'>
        <center style='margin: 0;'>
            <table style='width: 525px; height: 80px; border-top-width: 1px;
            border-top-color: #cdd4de; border-top-style: solid; border-bottom-width: 1px;
            border-bottom-color: #cdd4de; border-bottom-style: solid; border-spacing: 0 !important; margin: 0;'>
            <tbody><tr style='margin: 0;'>
            <td style='text-align: left; margin: 0; padding: 30px 0px 20px 0px;' align='center'>

            %mailContent%

            </td>
            </tr>
            </tbody></table>
        </center>
        </td>
        </tr>

        <tr style='margin: 0; background-color: %mailFooterBackgroundColor%;'>
        <td style='text-align: center; margin: 0; padding: 30px 20px 20px 20px; color: #FFF;' align='center'>
            %automaticallyGeneratedEmailNote%
        <br style='margin: 0;'>
        <br style='margin: 0;'>
         %unsubscribePart%
         <a href='%mailFooterSiteURL%' target='_blank' style='text-decoration: none; color: #FFF; margin: 0;'>
          © %currentYear% %mailFooterSiteName%
         </a>
        <br style='margin: 0;'>
        <br style='margin: 0;'>

        <a href='%mailFooterSiteURL%' target='_blank' style='text-decoration: none; color: #FFF; margin: 0;'>
        <img src='%mailFooterLogoURL%' alt='%mailFooterSiteName%' style='margin: 0;' height='22px'></a>

        </td>
        </tr>
        </tbody></table>
    </div>
    </div>
    </td>
    </tr>
    </tbody>
    </table>
</center>
</body></html>`;

    return body;
  }

  sendMail = async (mailContent: MailModel): Promise<any> =>
    new Promise<any>(async (resolve, reject): Promise<any> => {
      // create reusable transporter object using the default SMTP transport
      if (CONFIG.smtp === undefined || !CONFIG.isSendMail) {
        console.log('Mail send skipped: %s', mailContent.subject);
        return resolve('');
      }
      const smtpConfig = JSON.parse(JSON.stringify(CONFIG.smtp));
      smtpConfig.auth.pass = CONFIG.smtp.auth.pass;
      const transporter = nodemailer.createTransport(smtpConfig);
      // setup email data with unicode symbols
      // send mail with defined transport object
      if (!mailContent.mailFrom) {
        mailContent.mailFrom = CONFIG.mailFrom;
      }
      if (CONFIG.mailTo) {
        mailContent.mailTo = CONFIG.mailTo;
      }
      // mailContent.html = mailContent.html ? this.getHTMLTemplate(mailContent.html) : this.getHTMLTemplate(mailContent.text);
      mailContent.html = mailContent.text;

      const info = await transporter.sendMail(mailContent);
      console.log('Mail send "%s", result: %s', mailContent.subject, JSON.stringify(info));
      if (info.err) {
        reject(info.err);
      } else if (info.response) {
        resolve(info.response);
      } else {
        resolve(info.info);
      }
    })
}
